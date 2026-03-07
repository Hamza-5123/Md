const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.2.6",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Random pair with fixed canvas positioning",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, 'cache');
    const cachePath = path.join(cacheDir, `pair_${senderID}_${Date.now()}.png`);

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const allParticipants = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());

        if (allParticipants.length === 0) {
            return api.sendMessage("Is group mein aapke ilawa koi aur nahi hai!", threadID, messageID);
        }

        const randomID = allParticipants[Math.floor(Math.random() * allParticipants.length)];
        
        const senderData = await Users.getData(senderID) || {};
        const matchData = await Users.getData(randomID) || {};
        const senderName = senderData.name || "User";
        const matchName = matchData.name || "Partner";

        const matchPercentage = Math.floor(Math.random() * 41) + 60;
        const poetryList = [
            "Hazaaron mein chuna hai aapko,\nBas ab hamesha saath rehna.. ✨",
            "Suno! tum mere liye wahi ho,\nJo ek pyaasi zameen ke liye barish.. 🌧️",
            "Kitna haseen hota hai woh lamha,\nJab do ajnabi ek pyaari jodi ban jate hain.. ❤️",
            "Mili hai aaj humein woh jodi,\nJis ki misaal saari mehfil degi.. 🌹"
        ];
        const randomPoetry = poetryList[Math.floor(Math.random() * poetryList.length)];

        // Fixed URLs: Using Square avatars for better cropping
        const bgUrl = "https://i.imgur.com/fP8th1j.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
        const avatarUrl2 = `https://graph.facebook.com/${randomID}/picture?width=512&height=512`;

        // Helper function with better error handling
        async function getImg(url) {
            try {
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                return await loadImage(Buffer.from(res.data));
            } catch (e) {
                return await loadImage('https://i.imgur.com/6ve982S.png'); // Fallback image
            }
        }

        const [bg, avatar1, avatar2] = await Promise.all([
            getImg(bgUrl),
            getImg(avatarUrl1),
            getImg(avatarUrl2)
        ]);

        const canvas = createCanvas(735, 480);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(bg, 0, 0, 735, 480);

        const drawAvatar = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
            
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.stroke();
        };

        drawAvatar(avatar1, 190, 240, 105); 
        drawAvatar(avatar2, 545, 240, 105); 

        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(cachePath, canvas.toBuffer());

        const msg = {
            body: `💞 Haseen Jodi Mil Gayi Hai! 💞\n━━━━━━━━━━━━━━━━━━\n\n👤 Aap: ${senderName}\n👤 Partner: ${matchName}\n\n📝 Shayari:\n${randomPoetry}\n\n💓 Compatibility: ${matchPercentage}%\n\n✨ Mubarak Ho! ✨`,
            attachment: fs.createReadStream(cachePath)
        };

        return api.sendMessage(msg, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (err) {
        console.error("PAIR ERROR:", err);
        return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
};
