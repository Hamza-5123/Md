const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "song",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Priyansh / Gemini",
    description: "Download music from YouTube",
    commandCategory: "Media",
    usages: "[song name/URL]",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔑 APNI API KEY YAHA DALO
    const PRIYANSHU_API_KEY = "apim_xvY6cZuyLPTyju7BBJJOxynlf8Hp5tR19sXJIdEUZIA"; 

    if (!args.length) {
        return api.sendMessage("❌ Please enter a song name or YouTube URL.", threadID, messageID);
    }

    const input = args.join(" ");
    const tempDir = path.join(__dirname, "cache"); // Mirai standard 'cache' folder use karein
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    let searchingMsg;
    try {
        searchingMsg = await api.sendMessage(`🔍 Searching for "${input}"... Please wait.`, threadID);

        let videoUrl = input;
        let videoTitle = "";
        const isUrl = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/.test(input);

        // 1. YouTube Search Logic
        if (!isUrl) {
            const searchResult = await ytSearch(input);
            if (!searchResult || !searchResult.videos.length) {
                return api.sendMessage("❌ Song not found on YouTube.", threadID, messageID);
            }
            videoUrl = searchResult.videos[0].url;
            videoTitle = searchResult.videos[0].title;
        }

        // 2. Calling Priyanshu API
        const apiUrl = "https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download";
        const response = await axios.post(apiUrl, {
            link: videoUrl,
            format: "mp3",
            videoQuality: "360"
        }, {
            headers: {
                Authorization: `Bearer ${PRIYANSHU_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.data || !response.data.success) {
            return api.sendMessage("❌ API Error: Failed to get download link.", threadID, messageID);
        }

        const { downloadUrl, title } = response.data.data;
        const finalTitle = videoTitle || title || "music";
        const filePath = path.join(tempDir, `${Date.now()}.mp3`);

        // 3. File Size Check (Optional but recommended)
        const head = await axios.head(downloadUrl);
        if (head.headers["content-length"] > 50 * 1024 * 1024) { // 50MB Limit
            return api.sendMessage("❌ File is too large (Max 50MB).", threadID, messageID);
        }

        // 4. Download and Stream
        const downloadRes = await axios.get(downloadUrl, { responseType: "stream" });
        const writer = fs.createWriteStream(filePath);
        downloadRes.data.pipe(writer);

        writer.on("finish", () => {
            api.sendMessage({
                body: `🎵 Title: ${finalTitle}\n🔗 Source: YouTube`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                fs.unlinkSync(filePath); // Send hone ke baad file delete
                api.unsendMessage(searchingMsg.messageID);
            }, messageID);
        });

    } catch (error) {
        console.error(error);
        api.sendMessage("❌ Error: " + error.message, threadID, messageID);
    }
};
