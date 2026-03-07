const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports.config = {
    name: "pair",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "Priyansh Rajput",
    description: "Opposite gender match with visual canvas",
    commandCategory: "fun",
    usages: "pair",
    cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    const cachePath = path.join(__dirname, 'cache', `pair_${senderID}.png`);

    try {
        // 1. Get Sender & Thread Info
        const threadInfo = await api.getThreadInfo(threadID);
        const senderInfo = await api.getUserInfo(senderID);
        const senderGender = senderInfo[senderID].gender;
        const senderName = senderInfo[senderID].name;

        // 2. Filter Opposite Gender (1=Female, 2=Male)
        const targetGender = (senderGender === 1) ? 2 : 1;
        let list = [];
        
        for (const id of threadInfo.participantIDs) {
            if (id == senderID || id == api.getCurrentUserID()) continue;
            const info = await api.getUserInfo(id);
            if (info[id].gender === targetGender) list.push({ id, name: info[id].name });
        }

        // Agar opposite gender na mile to random pick karein
        if (list.length === 0) {
            const randomID = threadInfo.participantIDs[Math.floor(Math.random() * threadInfo.participantIDs.length)];
            const info = await api.getUserInfo(randomID);
            list.push({ id: randomID, name: info[randomID].name });
        }

        const match = list[Math.floor(Math.random() * list.length)];
        const matchPercentage = Math.floor(Math.random() * 40) + 60;

        // 3. Canvas Creation
        // Yahan aap apni pasand ka background URL daal sakte hain
        const bgUrl = "https://i.imgur.com/vH6Z49S.png"; 
        const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

        const [bg, avatar1, avatar2] = await Promise.all([
            loadImage(bgUrl),
            loadImage(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${token}`),
            loadImage(`https://graph.facebook.com/${match.id}/picture?width=512&height=512&access_token=${token}`)
        ]);

        const canvas = createCanvas(bg.width, bg.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(bg, 0, 0);

        // Circular Avatars
        const drawAvatar = (img, x, y) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + 125, y + 125, 125, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x, y, 250, 250);
            ctx.restore();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.stroke();
        };

        drawAvatar(avatar1, 100, 150); // Left side
        drawAvatar(avatar2, 450, 150); // Right side

        fs.writeFileSync(cachePath, canvas.toBuffer());

        // 4. Send Response
        const msg = `💕 **Match Found!** 💕\n\n` +
                    `👤 **Aap:** ${senderName}\n` +
                    `👤 **Partner:** ${match.name}\n` +
                    `💓 **Compatibility:** ${matchPercentage}%\n\n` +
                    `Ye jodi naseeb se milti hai!`;

        return api.sendMessage({
            body: msg,
            attachment: fs.createReadStream(cachePath),
            mentions: [{ tag: senderName, id: senderID }, { tag: match.name, id: match.id }]
        }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Error: Profile pictures load nahi ho sakin.", threadID, messageID);
    }
};
