const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "prodl",
    version: "3.0.1",
    author: "Shaan Khan",
    countDown: 5,
    role: 0,
    shortDescription: "PRO Video Downloader",
    longDescription: "Advanced multi-platform downloader with fallback APIs",
    category: "media"
  },

  onStart: async function ({ api, event, args }) {
    try {
      const url = args[0];
      if (!url) {
        return api.sendMessage("❌ | Please provide a video link", event.threadID);
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      let apiUrl = "";

      // 🔍 Improved Platform Detection
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        apiUrl = `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`;
      } else if (url.includes("tiktok.com")) {
        apiUrl = `https://api.ryzendesu.vip/api/downloader/tiktok?url=${encodeURIComponent(url)}`;
      } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
        apiUrl = `https://api.ryzendesu.vip/api/downloader/fbvideo?url=${encodeURIComponent(url)}&render=1`;
      } else if (url.includes("instagram.com")) {
        apiUrl = `https://api.ryzendesu.vip/api/downloader/igvideo?url=${encodeURIComponent(url)}`;
      } else {
        return api.sendMessage("❌ | Unsupported link or platform!", event.threadID);
      }

      // 🔁 Fetching Data
      const res = await axios.get(apiUrl);
      // Ryzendesu returns data inside res.data.url or res.data.data.url depending on endpoint
      const videoUrl = res.data.url || (res.data.data && (res.data.data.url || res.data.data.video));
      const title = res.data.title || res.data.metadata?.title || "Shaan Video 🎬";

      if (!videoUrl) {
        return api.sendMessage("❌ | Could not fetch video URL from API.", event.threadID);
      }

      const path = __dirname + `/cache/${Date.now()}.mp4`;

      const response = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(path);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);

        api.sendMessage(
          {
            body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
            attachment: fs.createReadStream(path)
          },
          event.threadID,
          () => fs.unlinkSync(path)
        );
      });

      writer.on("error", (err) => {
        console.error(err);
        api.sendMessage("❌ | Error writing file.", event.threadID);
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ | API Error or Timeout. Try again later.", event.threadID);
    }
  }
};
