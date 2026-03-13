/**
 * Rankup Command for Mirai
 * Notifies users when they level up with a Canvas image
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

module.exports.config = {
  name: "rankup",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭",
  description: "Level up hone par notification deta hai",
  commandCategory: "Economy",
  usages: "Automatic",
  cooldowns: 0,
};

// --- Helper for Canvas Generation ---
async function makeRankupImage(userID, name, level, theme) {
  const width = 1200;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, theme.bgStart);
  gradient.addColorStop(0.5, theme.bgMid);
  gradient.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Decorative Shapes
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 80, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Glassmorphism Overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(50, 50, width - 100, height - 100, 30);
  } else {
    ctx.rect(50, 50, width - 100, height - 100); // Fallback for older canvas versions
  }
  ctx.fill();

  // Avatar
  try {
    const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatarBuffer = (await axios.get(avatarUrl, { responseType: 'arraybuffer' })).data;
    const avatar = await loadImage(avatarBuffer);

    const avatarX = 100;
    const avatarY = 85;
    const avatarSize = 230;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.lineWidth = 8;
    ctx.strokeStyle = theme.accent;
    ctx.stroke();
  } catch (e) {
    console.log("Avatar load failed, skipping...");
  }

  // Text Info
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 60px sans-serif';
  ctx.fillText("LEVEL UP!", 380, 140);

  ctx.font = 'bold 50px sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.fillText(name.substring(0, 20), 380, 210);

  ctx.font = '40px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`You reached Level ${level}!`, 380, 280);

  const pathImg = path.join(__dirname, `rankup_${userID}_${Date.now()}.png`);
  fs.writeFileSync(pathImg, canvas.toBuffer());
  return pathImg;
}

// --- Main Event Handler ---
module.exports.handleEvent = async function({ api, event, Currencies, Users }) {
  const { threadID, senderID, body } = event;

  // Level logic (Mirai standard EXP calculation)
  // Level = floor(sqrt(1 + 8 * exp / 4) / 2) - dummy logic, usually handled by Mirai's internal system
  let data = (await Currencies.getData(senderID)).data || {};
  let exp = data.exp || 0;
  let currentLevel = Math.floor(Math.sqrt(1 + (4 * exp / 1000)) / 2);

  // Initialize tracker if not exists
  if (!global.rankUpTracker) global.rankUpTracker = new Map();
  
  const oldLevel = global.rankUpTracker.get(senderID) || 0;

  if (currentLevel > oldLevel && oldLevel !== 0) {
    const name = (await Users.getData(senderID)).name || "User";
    
    const themes = [
      { bgStart: '#0f0c29', bgMid: '#302b63', bgEnd: '#24243e', accent: '#00f2ff' },
      { bgStart: '#200122', bgMid: '#6f0000', bgEnd: '#c94b4b', accent: '#ff9966' },
      { bgStart: '#141e30', bgMid: '#243b55', bgEnd: '#141e30', accent: '#ffd700' }
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];

    try {
      const imgPath = await makeRankupImage(senderID, name, currentLevel, theme);
      
      const msg = {
        body: `🎉 𝗟𝗘𝗩𝗘𝗟 𝗨𝗣! 🎉\n\nCongratulations ${name}!\nYou have reached Level ${currentLevel}!\n\n💰 Bonus: ${currentLevel * 100} coins`,
        attachment: fs.createReadStream(imgPath),
        mentions: [{ tag: name, id: senderID }]
      };

      api.sendMessage(msg, threadID, () => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
      
      // Bonus reward logic
      await Currencies.increaseMoney(senderID, currentLevel * 100);
      
    } catch (err) {
      console.log("Rankup display error: " + err);
    }
  }

  // Update level tracker
  global.rankUpTracker.set(senderID, currentLevel);
};

module.exports.run = async function({ api, event }) {
  return api.sendMessage("Rankup notifications are active automatically!", event.threadID);
};
