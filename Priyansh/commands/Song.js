const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "song",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "Priyansh / Gemini",
    description: "Download music from YouTube",
    commandCategory: "Media",
    usages: "[song name/URL]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔑 API KEY
    const PRIYANSHU_API_KEY = "apim_xvY6cZuyLPTyju7BBJJOxynlf8Hp5tR19sXJIdEUZIA"; 

    if (!args.length) {
        return api.sendMessage("❌ Please enter a song name or YouTube URL.", threadID, messageID);
    }

    const input = args.join(" ");
    const cachePath = path.join(__dirname, "cache", `${Date.now()}.mp3`);
    if (!fs.existsSync(path.join(__dirname, "cache"))) fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });

    let searchingMsg;
    try {
        searchingMsg = await api.sendMessage(`🔍 Searching for "${input}"...`, threadID);

        // 1. YouTube Search
        const searchResult = await ytSearch(input);
        if (!searchResult || !searchResult.videos.length) {
            return api.sendMessage("❌ Song not found.", threadID, messageID);
        }
        const video = searchResult.videos[0];
        const videoUrl = video.url;

        // 2. Calling API (Updated to GET or Correct POST)
        // Note: Agar 400 aa raha hai, toh parameters check karein. 
        // Kuch APIs ko 'url' chahiye hota hai 'link' ki jagah.
        const apiUrl = `https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download`;
        
        const response = await axios.post(apiUrl, {
            url: videoUrl, // 'link' ko 'url' karke dekhein agar error barkarar rahe
            link: videoUrl,
            format: "mp3",
            quality: "320"
        }, {
            headers: {
                'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data.data;
        if (!data || !data.downloadUrl) {
            throw new Error("Download link not found in API response.");
        }

        // 3. Download File
        const writer = fs.createWriteStream(cachePath);
        const stream = await axios.get(data.downloadUrl, { responseType: "stream" });
        stream.data.pipe(writer);

        writer.on("finish", () => {
            api.sendMessage({
                body: `🎵 Title: ${video.title}\n⏱️ Duration: ${video.timestamp}\n👤 Artist: ${video.author.name}`,
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
                fs.unlinkSync(cachePath);
                if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
            }, messageID);
        });

    } catch (error) {
        console.error(error);
        if (searchingMsg) api.unsendMessage(searchingMsg.messageID);
        api.sendMessage(`❌ Error: ${error.response?.data?.message || error.message}\nCheck if your API Key is active.`, threadID, messageID);
    }
};
