const axios = require("axios");
const yts = require("yt-search");

/* 🎞 Loading Frames */
const frames = [
  "🎵 ▰▱▱▱▱▱▱▱▱▱ 10%",
  "🎶 ▰▰▰▰▱▱▱▱▱▱ 40%",
  "🎧 ▰▰▰▰▰▰▱▱▱▱ 70%",
  "❤️ ▰▰▰▰▰▰▰▰▰▰ 100%"
];

/* 🌐 API Setup */
const getBaseApi = async () => {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
    return res.data.api;
  } catch (e) {
    return "https://d-api-24.onrender.com"; // Fallback API
  }
};

async function getStreamFromURL(url, name) {
  const res = await axios.get(url, { responseType: "stream" });
  res.data.path = name;
  return res.data;
}

function cleanTitle(title = "") {
  return title.replace(/[\\/:*?"<>|]/g, "").trim();
}

/* ⚙ CONFIG */
module.exports.config = {
  name: "music",
  version: "2.3.0",
  credits: "Dipto", 
  hasPermssion: 0,
  cooldowns: 5,
  description: "Official YouTube MP3 Downloader",
  commandCategory: "media",
  usages: "song <name | link>"
};

module.exports.run = async function ({ api, args, event }) {
  if (!args[0]) {
    return api.sendMessage("❌ Song ka naam ya YouTube link dein.", event.threadID, event.messageID);
  }

  try {
    const loading = await api.sendMessage("✅  Apki Request Jari Hai Please wait...", event.threadID);

    // Animation Effect
    for (const f of frames) {
      await new Promise(r => setTimeout(r, 400));
      await api.editMessage(f, loading.messageID);
    }

    const diptoApi = await getBaseApi();
    const input = args.join(" ");
    
    // "official audio" suffix add kiya gaya hai search quality behtar karne ke liye
    const searchQuery = /youtu\.be|youtube\.com/.test(input) ? input : `${input} official audio`;
    
    const search = await yts(searchQuery);
    const video = search.videos && search.videos[0];

    if (!video) {
      return api.sendMessage("⚠️ Koi result nahi mila.", event.threadID, event.messageID);
    }

    const { data } = await axios.get(`${diptoApi}/ytDl3?link=${video.videoId}&format=mp3`);

    await api.unsendMessage(loading.messageID);

    return api.sendMessage({
      body: `🎵 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n⏱ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${video.timestamp}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n👀 𝗩𝗶𝗲𝘄𝘀: ${video.views.toLocaleString()}\n📅 𝗨𝗽𝗹𝗼𝗮𝗱𝗲𝗱: ${video.ago}\n\n✅ Official Audio Processed`,
      attachment: await getStreamFromURL(data.downloadLink, `${cleanTitle(video.title)}.mp3`)
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Error: Song download nahi ho saka.", event.threadID, event.messageID);
  }
};
