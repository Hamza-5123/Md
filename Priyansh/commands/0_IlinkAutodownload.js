const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.8.0",
    hasPermssion: 0,
    credits: "ISMRST-SHAAN",
    description: "Auto download FB, YT (Shorts), IG, TikTok & Pinterest.",
    commandCategory: "Utilities",
    usages: "Link paste karein (YT Shorts/Pinterest added)",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    // Event handler handle karega
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID } = event;

    if (!body || !body.startsWith("https://")) return;

    // Regex Updates
    const fbRegex = /(fb\.watch|facebook\.com|fb\.gg)/ig;
    const igRegex = /(instagram\.com)/ig;
    const ytRegex = /(youtube\.com|youtu\.be|youtube\.com\/shorts)/ig; // Added Shorts
    const ttRegex = /(tiktok\.com)/ig;
    const pinRegex = /(pinterest\.com|pin\.it)/ig; // Added Pinterest

    if (fbRegex.test(body) || igRegex.test(body) || ytRegex.test(body) || ttRegex.test(body) || pinRegex.test(body)) {

      api.setMessageReaction("⌛", messageID, () => {}, true);

      const cacheDir = path.join(process.cwd(), "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const fileName = `shaan_dl_${Date.now()}.mp4`;
      const cachePath = path.join(cacheDir, fileName);

      try {
        const { alldown } = require("arif-babu-downloader");

        // Alldown API handles most links, but we ensure the URL is clean
        const res = await alldown(body);
        
        // Pinterest aur YT Shorts ke liye quality priority check
        const videoUrl = res.data.high || res.data.low || res.data.url;

        if (!videoUrl) {
           api.setMessageReaction("❌", messageID, () => {}, true);
           return;
        }

        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        const videoTitle = res.data.title || "Downloaded Media";
        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle} 💔\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

        return api.sendMessage({
          body: caption,
          attachment: fs.createReadStream(cachePath)
        }, threadID, (err) => {
          if (!err) {
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

      } catch (err) {
        console.error("Download Error:", err.message);
        api.setMessageReaction("⚠️", messageID, () => {}, true);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }
    }
  }
};
