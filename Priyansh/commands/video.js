const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "video",
    aliases: ["ytvideo"],
    version: "1.7.0",
    credits: "Priyansh / Gemini",
    hasPermssion: 0,
    commandCategory: "Media",
    description: "Download video from YouTube with reactions and optimized formatting",
    usages: "[video name/URL]",
    cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // 🔑 API KEY (Priyanshu API)
    const PRIYANSHU_API_KEY = "apim_xvY6cZuyLPTyju7BBJJOxynlf8Hp5tR19sXJIdEUZIA"; 

    if (!args.length) {
        return api.sendMessage("❌ Please enter a video name or YouTube URL.", threadID, messageID);
    }

    const input = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    const fileName = `${Date.now()}.mp4`;
    const cachePath = path.join(cacheDir, fileName);
    
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    let processingMsg;
    try {
        // 1. Initial Reaction (Loading)
        api.setMessageReaction("⌛", messageID, (err) => {}, true);

        // Status Message
        processingMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

        // 2. YouTube Search
        const searchResult = await ytSearch(input);
        if (!searchResult || !searchResult.videos.length) {
            api.setMessageReaction("❌", messageID, (err) => {}, true);
            if (processingMsg) api.unsendMessage(processingMsg.messageID);
            return api.sendMessage("❌ Video not found.", threadID, messageID);
        }
        const video = searchResult.videos[0];
        const videoUrl = video.url;

        // 3. Calling API for Video Download Link
        const apiUrl = `https://priyanshuapi.xyz/api/runner/youtube-downloader-v2/download`;
        const response = await axios.post(apiUrl, {
            url: videoUrl,
            format: "mp4",
            videoQuality: "360" // Standard quality for FB
        }, {
            headers: {
                'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const data = response.data.data;
        if (!data || !data.downloadUrl) {
            throw new Error("Download link not found.");
        }

        // 4. Formatting Message (Title/Details with Gaps + Your Footer)
        const infoMsg = `🎥 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n⏱️ 𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻: ${video.timestamp}\n\n👤 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: ${video.author.name}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰     👉VIDEO`;
        
        await api.sendMessage(infoMsg, threadID);

        // 5. Stream Download for Large Videos
        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({
            url: data.downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
            const stats = fs.statSync(cachePath);
            const fileSizeInMB = stats.size / (1024 * 1024);

            // Messenger limit for video is usually 25MB-40MB depending on bot account
            if (fileSizeInMB > 45) {
                api.setMessageReaction("❌", messageID, (err) => {}, true);
                api.sendMessage(`⚠️ Video size (${fileSizeInMB.toFixed(2)}MB) is too large for Messenger.`, threadID, messageID);
                return fs.unlinkSync(cachePath);
            }

            // Send Video File
            api.sendMessage({
                attachment: fs.createReadStream(cachePath)
            }, threadID, (err) => {
                if (!err) {
                    // Final Reaction (Done)
                    api.setMessageReaction("✅", messageID, (err) => {}, true);
                }
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                if (processingMsg) api.unsendMessage(processingMsg.messageID);
            });
        });

        writer.on("error", (err) => { throw err; });

    } catch (error) {
        console.error(error);
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        if (processingMsg) api.unsendMessage(processingMsg.messageID);
        api.sendMessage(`❌ Failed: ${error.message}`, threadID, messageID);
    }
};
