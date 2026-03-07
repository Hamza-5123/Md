const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "3.2.5",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Random pair with fixed canvas positioning",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cachePath = path.join(__dirname, 'cache', `pair_${senderID}_${Date.now()}.png`);

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const allParticipants = threadInfo.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID());

        if (allParticipants.length === 0) {
            return api.sendMessage("Is group mein aapke ilawa koi aur nahi hai!", threadID, messageID);
        }

        const randomID = allParticipants[Math.floor(Math.random() * allParticipants.length)];
        
        // Fetch names safely
        const senderData = await Users.getData(senderID);
        const matchData = await Users.getData(randomID);
        const senderName = senderData.name || "User";
        const matchName = matchData.name || "Partner";

        const matchPercentage = Math.floor(Math.random() * 41) + 60;
        const poetryList = [
            "Hazaaron mein chuna hai aapko,\nBas ab hamesha saath rehna.. ✨",
            "Suno! tum mere liye wahi ho,\nJo ek pyaasi zameen ke liye barish.. 🌧️",
            "Kitna haseen hota hai woh lamha,\nJab do ajnabi ek pyaari jodi ban jate hain.. ❤️",
            "Mili hai aaj humein woh jodi,\nJis ki misaal saari mehfil degi.. 🌹",
            "Log kehte hain jodiyaan upar se banti hain,\nLagta hai humne aaj zameen par hi milwa di.. ✨",
            "Ek naam tera, ek naam mera..\nBas yuhi rahe ye saath silsila tera mera.. ❤️"
        ];
        const randomPoetry = poetryList[Math.floor(Math.random() * poetryList.length)];

        const bgUrl = "https://i.imgur.com/fP8th1j.jpeg"; 
        const avatarUrl1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarUrl2 = `https://graph.facebook.com/${randomID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

        async function getImg(url) {
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            return await loadImage(Buffer.from(res.data));
        }

        const [bg, avatar1, avatar2] = await Promise.all([
            getImg(bgUrl),
            getImg(avatarUrl1).catch(() => loadImage('https://i.imgur.com/6ve982S.png')),
            getImg(avatarUrl2).catch(() => loadImage('https://i.imgur.com/6ve982S.png'))
        ]);

        // Canvas dimensions matching the background
        const canvas = createCanvas(735, 480);
        const ctx = canvas.getContext('2d');
        
        // Draw Background
        ctx.drawImage(bg, 0, 0, 735, 480);

        // Helper function for circular avatars
        const drawAvatar = (img, x, y, radius) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            // Scaling image to fit the circle perfectly
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
            ctx.restore();
            
            // Optional: White Border around circle
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.stroke();
        };

        /**
         * ADJUSTED COORDINATES
         * Canvas width: 735, Height: 480
         * Left Circle: x=190, y=240
         * Right Circle: x=545, y=240
         * Radius: 105 (Best fit for this template)
         */
        drawAvatar(avatar1, 190, 240, 105); 
        drawAvatar(avatar2, 545, 240, 105); 

        // Save and Send
        if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'));
        fs.writeFileSync(cachePath, canvas.toBuffer());

        const msg = `💞 Haseen Jodi Mil Gayi Hai! 💞\n` +
                    `━━━━━━━━━━━━━━━━━━\n\n` +
                    `👤 Aap: ${senderName}\n` +
                    `👤 Aapka Partner: ${matchName}\n\n` +
                    `📝 Shayari:\n${randomPoetry}\n\n` +
                    `💓 Compatibility: ${matchPercentage}%\n\n` +
                    `✨ Mubarak Ho! Yeh jodi bohot pyari hai. ✨`;

        return api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Error: Image process nahi ho saki.", threadID, messageID);
    }
};
