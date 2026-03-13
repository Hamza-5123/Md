const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
  name: "rankup",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Automated Rankup Notification with Canvas",
  commandCategory: "system",
  usages: "",
  cooldowns: 0,
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  const { threadID, senderID } = event;
  if (!senderID || !threadID || senderID == api.getCurrentUserID()) return;

  try {
    let userData = await Currencies.getData(senderID);
    let exp = userData.exp || 0;
    let currentLevel = Math.floor(exp / 500);

    if (typeof global.rankUpTracker === "undefined") global.rankUpTracker = new Map();
    let oldLevel = global.rankUpTracker.get(senderID);

    if (oldLevel !== undefined && currentLevel > oldLevel) {
      const user = await Users.getData(senderID);
      const name = user.name || "User";
      
      // Canvas Setup
      const canvas = createCanvas(800, 250);
      const ctx = canvas.getContext('2d');

      // Background Style
      ctx.fillStyle = "#141414"; // Dark theme
      ctx.fillRect(0, 0, 800, 250);
      
      // Draw a border
      ctx.strokeStyle = "#00ff99";
      ctx.lineWidth = 8;
      ctx.strokeRect(5, 5, 790, 240);

      // Fetch Avatar (Error handling ke saath)
      try {
        const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`; 
        const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatar = await loadImage(Buffer.from(response.data, 'utf-8'));
        
        // Circular Avatar mask
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 125, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 45, 45, 160, 160);
        ctx.restore();
      } catch (e) {
        // Agar avatar fail ho jaye toh placeholder ya skip
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(125, 125, 80, 0, Math.PI * 2, true);
        ctx.fill();
      }

      // Text Render
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 50px sans-serif";
      ctx.fillText("LEVEL UP!", 250, 90);
      
      ctx.fillStyle = "#00ff99";
      ctx.font = "italic 38px sans-serif";
      ctx.fillText(name, 250, 150);
      
      ctx.fillStyle = "#aaaaaa";
      ctx.font = "30px sans-serif";
      ctx.fillText(`New Level: ${currentLevel}`, 250, 205);

      const imgPath = path.join(__dirname, `rankup_${senderID}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      await Currencies.increaseMoney(senderID, 500); 
      
      api.sendMessage({
        body: `🎊 Badhai ho ${name}!\nAapka level badh kar ${currentLevel} ho gaya hai.\nBonus: 500 coins mil gaye!`,
        attachment: fs.createReadStream(imgPath),
        mentions: [{ tag: name, id: senderID }]
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
    }

    global.rankUpTracker.set(senderID, currentLevel);

  } catch (err) {
    console.error("Rankup Error:", err);
  }
};

module.exports.run = async function({ api, event }) {
    return api.sendMessage("Rankup notification system active hai ✅", event.threadID);
};
