const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "suno",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Shaan",
  description: "Official Style Interactive Suno AI Generator",
  commandCategory: "AI Music",
  usages: "suno",
  cooldowns: 10
};

const API_KEYS = [
  'Koja-64118e456c1d20ec4b75a9914ec70f6a',
  'Koja-3ce2fd6170ea41e13acf3e7e347a5719',
  'Koja-096a3b8e8046783b1b59643a548ae35d'
];

const BASE_URL = 'https://kojaxd-api.vercel.app/ai/sunoai';

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  return api.sendMessage(
    "📝 **Step 1:** Apne gaane ke **Custom Lyrics** yahan type karein:",
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        step: 1,
        name: this.config.name,
        author: senderID,
        messageID: info.messageID
      });
    },
    messageID
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  const step = handleReply.step;

  try {
    // --- STEP 1: Lyrics Receive Karo aur Gender Pucho ---
    if (step === 1) {
      const lyrics = body;
      return api.sendMessage(
        "🎙️ **Step 2:** Voice choose karein:\n\n1. Male 👨\n2. Female 👩",
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            step: 2,
            name: this.config.name,
            author: senderID,
            lyrics: lyrics,
            messageID: info.messageID
          });
        },
        messageID
      );
    }

    // --- STEP 2: Gender Receive Karo aur Style Pucho ---
    if (step === 2) {
      const gender = (body == "1" || body.toLowerCase() === "male") ? "Male" : "Female";
      return api.sendMessage(
        "🎸 **Step 3:** Music ka **Style** select karein:\n\n- Classic\n- Hip Hop\n- Pop\n- Rock\n- Lo-fi",
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            step: 3,
            name: this.config.name,
            author: senderID,
            lyrics: handleReply.lyrics,
            gender: gender,
            messageID: info.messageID
          });
        },
        messageID
      );
    }

    // --- STEP 3: Style Receive Karo aur Title Pucho ---
    if (step === 3) {
      const style = body;
      return api.sendMessage(
        "🏷️ **Step 4:** Apne Song ka **Title (Naam)** kya rakhna chahte hain?",
        threadID,
        (err, info) => {
          global.client.handleReply.push({
            step: 4,
            name: this.config.name,
            author: senderID,
            lyrics: handleReply.lyrics,
            gender: handleReply.gender,
            style: style,
            messageID: info.messageID
          });
        },
        messageID
      );
    }

    // --- STEP 4: Title Receive Karo aur Song Generate Karo ---
    if (step === 4) {
      const title = body;
      const { lyrics, gender, style } = handleReply;
      const fullStyle = `${gender} voice, ${style} style`;

      api.sendMessage(`⏳ Processing...\n\n🎵 Title: ${title}\n🎤 Voice: ${gender}\n🎸 Style: ${style}\n\nGaana taiyar ho raha hai, thoda intezar karein...`, threadID, messageID);

      const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
      const createUrl = `${BASE_URL}?apikey=${apiKey}&action=create&prompt=${encodeURIComponent(lyrics)}&style=${encodeURIComponent(fullStyle)}&title=${encodeURIComponent(title)}`;
      
      const createRes = await axios.get(createUrl);
      if (!createRes.data.status) throw new Error("API Limit reached!");

      const taskId = createRes.data.task_id;
      let audioUrl = null;

      // Polling for Status
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const statusRes = await axios.get(`${BASE_URL}?apikey=${apiKey}&action=status&task_id=${taskId}`);
        const data = statusRes.data.result?.[0]?.data?.data?.[0] || statusRes.data.result?.[0];

        if (data && data.audioUrl) {
          audioUrl = data.audioUrl;
          break;
        }
      }

      if (!audioUrl) return api.sendMessage("❌ Error: Gaana banane mein zyada waqt lag raha hai. Dubara try karein.", threadID, messageID);

      const filePath = path.join(__dirname, "cache", `suno_${Date.now()}.mp3`);
      const response = await axios({ method: 'get', url: audioUrl, responseType: 'arraybuffer' });
      await fs.writeFile(filePath, Buffer.from(response.data));

      return api.sendMessage({
        body: `✅ **Song Generated!**\n\n🎼 Title: ${title}\n🎭 Genre: ${style}\n🎙️ Vocal: ${gender}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    }

  } catch (error) {
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
