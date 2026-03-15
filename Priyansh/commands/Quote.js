const axios = require("axios");

module.exports.config = {
  name: "quote",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Stylish Quote using Groq",
  commandCategory: "ai",
  usages: "[topic/vibe]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const userPrompt = args.join(" ") || "inspirational and deep life quote";

  api.sendMessage("⌛ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕 𝑺𝒉𝒂𝒂𝒏 𝑲𝒉𝒂𝒏...", threadID, messageID);

  try {
    // Groq API Integration
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a poetic quote generator. Provide only the quote text, short and powerful, without quotes or author name."
          },
          {
            role: "user",
            content: `Generate a stylish and deep quote about: ${userPrompt}`
          }
        ]
      },
      {
        headers: {
          "Authorization": `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`,
          "Content-Type": "application/json"
        }
      }
    );

    const quote = groqResponse.data.choices[0].message.content;

    // Image Generation using Pollinations
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      quote + " aesthetic cinematic nature 4k background soft lighting"
    )}`;

    const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const image = imageRes.data;

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
    console.error(err);
    api.sendMessage("❌ 𝑬𝒓𝒓𝒐𝒓: Groq API connection failed.", threadID, messageID);
  }
};
