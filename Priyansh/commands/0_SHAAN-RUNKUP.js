const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
  name: "rankup",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
  description: "Automated Rankup Notification",
  commandCategory: "system",
  usages: "",
  cooldowns: 0,
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  const { threadID, senderID, body } = event;
  if (!senderID || !threadID || senderID == api.getCurrentUserID()) return;

  try {
    // 1. Data Get Karo
    let userData = await Currencies.getData(senderID);
    let exp = userData.exp || 0;
    
    // 2. Simple Level Formula (Har 500 XP par level up)
    let currentLevel = Math.floor(exp / 500);

    // 3. Level Tracker Check
    if (typeof global.rankUpTracker === "undefined") global.rankUpTracker = new Map();
    
    let oldLevel = global.rankUpTracker.get(senderID);

    // Agar level badha hai (Peheli baar check hone par notification nahi jayega)
    if (oldLevel !== undefined && currentLevel > oldLevel) {
      const name = (await Users.getData(senderID)).name || "User";
      
      // Canvas Drawing
      const canvas = createCanvas(800, 250);
      const ctx = canvas.getContext('2d');

      // Simple Clean Background
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, 800, 250);
      ctx.strokeStyle = "#00ff99";
      ctx.lineWidth = 5;
      ctx.strokeRect(10, 10, 780, 230);

      // Avatar
      const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarBuffer = (await axios.get(avatarUrl, { responseType: 'arraybuffer' })).data;
      const avatar = await loadImage(avatarBuffer);
      ctx.drawImage(avatar, 50, 50, 150, 150);

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 45px Arial";
      ctx.fillText("LEVEL UP!", 250, 100);
      
      ctx.fillStyle = "#00ff99";
      ctx.font = "35px Arial";
      ctx.fillText(name, 250, 160);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "30px Arial";
      ctx.fillText(`Reached Level: ${currentLevel}`, 250, 210);

      const imgPath = path.join(__dirname, `rankup_${senderID}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      // Send & Reward
      await Currencies.increaseMoney(senderID, 500); // 500 coins bonus
      
      api.sendMessage({
        body: `🎊 Badhai ho ${name}!\nAapka level badh kar ${currentLevel} ho gaya hai.\nBonus: 500 coins mil gaye!`,
        attachment: fs.createReadStream(imgPath),
        mentions: [{ tag: name, id: senderID }]
      }, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
    }

    // Har message par tracker update karo
    global.rankUpTracker.set(senderID, currentLevel);

  } catch (err) {
    // console.log(err); // Error check karne ke liye ise uncomment karein
  }
};

module.exports.run = async function({ api, event }) {
    return api.sendMessage("Rankup notification system ON hai ✅", event.threadID);
};
