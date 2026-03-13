/**
 * Rankup Command for Mirai
 * Purified & Optimized version
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
  name: "rankup",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
  description: "Level up hone par notification automatically bhejta hai",
  commandCategory: "Economy",
  usages: "Automatic",
  cooldowns: 2,
};

module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  const { threadID, senderID } = event;
  if (!senderID || !threadID) return;

  // Mirai Default Level Calculation logic
  const userData = (await Currencies.getData(senderID)) || {};
  const exp = userData.exp || 0;
  const currentLevel = Math.floor(Math.sqrt(1 + (4 * exp / 1000)) / 2);

  // Global tracker to prevent spam and detect actual level up
  if (!global.rankUpTracker) global.rankUpTracker = new Map();
  const oldLevel = global.rankUpTracker.get(senderID);

  // Sirf tab trigger hoga jab level sach mein badhega
  if (oldLevel !== undefined && currentLevel > oldLevel) {
    try {
      const name = (await Users.getData(senderID)).name || "User";
      
      // Random Theme Selection
      const themes = [
        { bg: '#0f0c29', accent: '#00f2ff' },
        { bg: '#200122', accent: '#ff9966' },
        { bg: '#000000', accent: '#00ff99' }
      ];
      const theme = themes[Math.floor(Math.random() * themes.length)];

      // --- Canvas Generation ---
      const canvas = createCanvas(1200, 400);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, 1200, 400);

      // Avatar Logic
      const avatarUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarBuffer = (await axios.get(avatarUrl, { responseType: 'arraybuffer' })).data;
      const avatar = await loadImage(avatarBuffer);

      ctx.save();
      ctx.beginPath();
      ctx.arc(215, 200, 115, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, 100, 85, 230, 230);
      ctx.restore();

      // Border
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 10;
      ctx.stroke();

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 70px sans-serif";
      ctx.fillText("LEVEL UP!", 400, 150);
      
      ctx.fillStyle = theme.accent;
      ctx.font = "bold 50px sans-serif";
      ctx.fillText(name.slice(0, 15), 400, 230);

      ctx.fillStyle = "#ffffff";
      ctx.font = "40px sans-serif";
      ctx.fillText(`You've reached Level ${currentLevel}`, 400, 310);

      const pathImg = path.join(__dirname, `rank_${senderID}.png`);
      fs.writeFileSync(pathImg, canvas.toBuffer());

      // Send Message & Bonus
      const bonus = currentLevel * 100;
      await Currencies.increaseMoney(senderID, bonus);

      api.sendMessage({
        body: `🎉 Congratulations ${name}!\nLevel Up: ${currentLevel}\nBonus: +${bonus} coins`,
        attachment: fs.createReadStream(pathImg),
        mentions: [{ tag: name, id: senderID }]
      }, threadID, () => fs.unlinkSync(pathImg));

    } catch (e) {
      console.error("Rankup Error:", e);
    }
  }

  // Update Tracker
  global.rankUpTracker.set(senderID, currentLevel);
};

module.exports.run = async function({ api, event }) {
  // Empty run because it works on events
  return api.sendMessage("Rankup notification is active!", event.threadID);
};
