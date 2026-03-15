const axios = require("axios");

module.exports = {
  config: {
    name: "quote",
    version: "5.0.0",
    author: "Shaan Khan",
    countDown: 10,
    role: 0, // Sab ke liye
    shortDescription: "Generates Urdu quote and AI image",
    longDescription: "AI generates a deep Urdu quote and a matching background image.",
    category: "ai",
    guide: "{p}quote",
    hasPermission: 0, // 0 for everyone
    usePrefix: true // Prefix ke saath chalega
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const apiKey = "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";

    // Chhota sa loading message
    api.sendMessage("⌛ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕 Shaan Khan...", threadID, messageID);

    try {
      // 1. Groq AI se quote lena
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "Create a short, poetic, and deep life quote in Urdu script. No English or Roman Urdu."
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

      // 2. Pollinations AI Image
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(quote + " aesthetic cinematic scenery, 4k, realistic")}?width=1080&height=1080&nologo=true`;
      
      const imageStream = (await axios.get(imageUrl, { responseType: 'stream' })).data;

      // 3. Final Response
      const msg = {
        body: `╔══════════════════╗\n  ✨ 𝑨𝑰 𝑸𝑼𝑶𝑻𝑬 & 𝑰𝑴𝑨𝑮𝑬 ✨  \n╚══════════════════╝\n\n📝 ${quote}\n\n👤 𝑶𝒘𝒏𝒆𝒓: 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧`,
        attachment: imageStream
      };

      return api.sendMessage(msg, threadID, messageID);

    } catch (e) {
      console.log(e);
      return api.sendMessage("❌ Kuch masla aa raha hai, please check API key or network.", threadID, messageID);
    }
  }
};
