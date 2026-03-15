const axios = require("axios");

module.exports.config = {
  name: "quote",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Stylish Quote using Updated Groq Model",
  commandCategory: "ai",
  usages: "[topic]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const userPrompt = args.join(" ") || "Short inspirational life quote";

  api.sendMessage("⌛ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕 𝑺𝒉𝒂𝒂𝒏 𝑲𝒉𝒂𝒏...", threadID, messageID);

  try {
    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile", 
        messages: [
          {
            role: "system",
            content: "Generate one short, aesthetic quote. Only return the quote text without any extra words."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer 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`,
          "Content-Type": "application/json"
        }
      }
    );

    const quote = groqResponse.data.choices[0].message.content;

    // Image Generation (Pollinations)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      quote + " aesthetic cinematic nature 4k background"
    )}?width=1024&height=1024&nologo=true`;

    const imageRes = await axios.get(imageUrl, { 
      responseType: "arraybuffer",
      timeout: 20000 // 20 seconds timeout for image
    });

    const bodyText = `╔══════════════════╗\n   ✨ 𝑨𝑰 𝑸𝑼𝑶𝑻𝑬 𝑮𝑬𝑵𝑬𝑹𝑨𝑻𝑶𝑹 ✨\n╚══════════════════╝\n\n📝 ${quote}\n\n╭───────────────╮\n👑 𝑶𝒘𝒏𝒆𝒓: 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧\n╰───────────────╯`;

    return api.sendMessage(
      {
        body: bodyText,
        attachment: Buffer.from(imageRes.data)
      },
      threadID,
      messageID
    );

  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error("GROQ/IMAGE ERROR:", errMsg);
    return api.sendMessage(`❌ 𝑬𝒓𝒓𝒐𝒓: ${errMsg}`, threadID, messageID);
  }
};
