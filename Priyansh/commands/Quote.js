const axios = require("axios");

module.exports = {
  config: {
    name: "quote",
    version: "3.0.0",
    role: 0,
    author: "Shaan Khan",
    description: "Generates a fresh stylish quote and matching AI image",
    category: "ai",
    guide: "{p}quote"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const apiKey = "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";

    api.sendMessage("⏳ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕... 𝑮𝒆𝒏𝒆𝒓𝒂𝒕𝒊𝒏𝒈 𝑸𝒖𝒐𝒕𝒆 & 𝑰𝒎𝒂𝒈𝒆...", threadID, messageID);

    try {
      // Step 1: Groq AI se Urdu Quote
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "Generate a short, deep, and emotional life quote in Urdu script. No English, no Roman. Just the quote."
            }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const quote = res.data.choices[0].message.content;

      // Step 2: Image Prompt
      const imagePrompt = `Cinematic background, poetic atmosphere, high resolution, related to: ${quote}`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1080&height=1080&nologo=true`;

      const message = `╔══════════════════╗\n` +
                      `  ✨ 𝑨𝑰 𝑸𝑼𝑶𝑻𝑬 & 𝑰𝑴𝑨𝑮𝑬 ✨  \n` +
                      `╚══════════════════╝\n\n` +
                      `📝 ${quote}\n\n` +
                      `👤 𝑶𝒘𝒏𝒆𝒓: 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧`;

      // Step 3: Get Image Stream
      const response = await axios.get(imageUrl, { responseType: 'stream' });
      
      return api.sendMessage({ body: message, attachment: response.data }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Error: API Key check karein ya network ka masla hai.", threadID, messageID);
    }
  }
};
