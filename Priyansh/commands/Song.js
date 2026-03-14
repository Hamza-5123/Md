const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "song",
    version: "1.4.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Download music from YouTube with optimized streaming",
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
    const cacheDir = path.join(__dirname, "cache");
    const fileName = `${Date.now()}.mp3`;
    const cachePath = path.join(cacheDir, fileName);
    
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg;
    try {
        // Direct Status Message
        processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

        // 1. YouTube Search (Top result only)
        const searchResult = await ytSearch(input);
        if (!searchResult || !searchResult.videos.length) {
            return api.sendMessage("❌ Song not found.", threadID, messageID);
        }
        const video = searchResult.videos[0];
        const videoUrl = video.url;

        // 2. Calling API for Download Link
        const apiUrl = `https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download`;
        const response = await axios.post(apiUrl, {
            url: videoUrl,
            format: "mp3",
            quality: "320"
        }, {
            headers: {
                'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout for API response
        });

        const data = response.data.data;
        if (!data || !data.downloadUrl) {
            throw new Error("Download link not found.");
        }

        // 3. Pehle Title details bhejna (No reply, just message)
        const infoMsg = `🎵 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${video.timestamp}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}`;
        await api.sendMessage(infoMsg, threadID);

        // 4. File Stream Download (For handling large files)
        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({
            url: data.downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        // Pipe the stream to handle large data without memory spikes
        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            // Check file size (FB limits apply, usually 25MB - 50MB for bots)
            const stats = fs.statSync(cachePath);
            const fileSizeInMB = stats.size / (1024 * 1024);

            if (fileSizeInMB > 45) { // Messenger safe limit
                api.sendMessage("⚠️ File is too large to send on Messenger (Max 45MB).", threadID, messageID);
                return fs.unlinkSync(cachePath);
            }

            // Send file as attachment
            api.sendMessage({
                attachment: fs.createReadStream(cachePath)
            }, threadID, (err) => {
                if (err) console.error("Send Error:", err);
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                if (processingMsg) api.unsendMessage(processingMsg.messageID);
            });
        });

        writer.on("error", (err) => {
            throw err;
        });

    } catch (error) {
        console.error(error);
        if (processingMsg) api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Failed: ${error.message}`, threadID, messageID);
    }
};
