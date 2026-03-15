const axios = require("axios");

module.exports.config = {
  name: "quote",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Stylish Quote",
  commandCategory: "ai",
  usages: "",
  cooldowns: 10
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  api.sendMessage("⌛ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕 𝑺𝒉𝒂𝒂𝒏 𝑲𝒉𝒂𝒏...", threadID, messageID);

  try {

    const quoteRes = await axios.get("https://api.quotable.io/random");
    const quote = quoteRes.data.content;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      quote + " aesthetic cinematic nature 4k"
    )}`;

    const image = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    api.sendMessage(
      {
        body:
`╔══════════════════╗
   ✨ 𝑨𝑰 𝑸𝑼𝑶𝑻𝑬 𝑮𝑬𝑵𝑬𝑹𝑨𝑻𝑶𝑹 ✨
╚══════════════════╝

📝 ${quote}

╭───────────────╮
👑 𝑶𝒘𝒏𝒆𝒓: 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧
╰───────────────╯`,
        attachment: Buffer.from(image)
      },
      threadID,
      messageID
    );

  } catch (err) {
    console.log(err);
    api.sendMessage("❌ 𝑬𝒓𝒓𝒐𝒓 𝒂𝒂 𝒈𝒚𝒂 𝑨𝑷𝑰 𝒎𝒆𝒊𝒏.", threadID, messageID);
  }
};
