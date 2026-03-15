const axios = require("axios");

module.exports.config = {
  name: "quote",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "AI Stylish Quote using Groq API",
  commandCategory: "ai",
  usages: "[topic]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const userPrompt = args.join(" ") || "Short inspirational life quote";

  api.sendMessage("⌛ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕 𝑺𝒉𝒂𝒂𝒏 𝑲𝒉𝒂𝒏...", threadID, messageID);

  try {
    const groqResponse = await axios({
      method: 'post',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json'
      },
      data: {
        model: "llama3-70b-8192", // Stable model version
        messages: [
          {
            role: "system",
            content: "Generate one short, aesthetic quote. Only return the quote text."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7
      }
    });

    const quote = groqResponse.data.choices[0].message.content;

    // Pollinations for image
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      quote + " aesthetic cinematic nature 4k wallpaper"
    )}?width=1024&height=1024&nologo=true`;

    const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });

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
        attachment: Buffer.from(imageRes.data)
      },
      threadID,
      messageID
    );

  } catch (err) {
    // Ye terminal mein check karein ke error kya hai
    console.error("GROQ ERROR DETAILS:", err.response ? err.response.data : err.message);
    
    api.sendMessage(`❌ 𝑬𝒓𝒓𝒐𝒓: ${err.response?.data?.error?.message || "API Connection Issue"}`, threadID, messageID);
  }
};
