const axios = require("axios");

module.exports = {
  config: {
    name: "quote", // Command ka naam thoda change kiya hai
    version: "3.0.0",
    role: 0,
    author: "Shaan Khan",
    description: "Generates a fresh stylish quote and matching AI image",
    category: "ai",
    guide: "{p}quote_image"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;
    const apiKey = "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"; // Yahan apni asli Groq API key lagayein

    api.sendMessage("⏳ 𝑷𝒍𝒆𝒂𝒔𝒆 𝒘𝒂𝒊𝒕... 𝑮𝒆𝒏𝒆𝒓𝒂𝒕𝒊𝒏𝒈 𝑸𝒖𝒐𝒕𝒆 & 𝑰𝒎𝒂𝒈𝒆...", threadID, messageID);

    try {
      // Step 1: Groq AI se Urdu Quote generate karwayein
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are a creative writer. Generate a short, deep, and emotional life quote in Urdu script. The tone should be inspiring or nostalgic. Provide only the quote text without any additional words or prefix."
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

      // Step 2: Pollinations AI ke liye image prompt banayein
      // Hum isi quote ko image generation ke liye as a prompt use karenge
      // Kuch stylish visual prompts bhi add kar dete hain.
      const imagePrompt = `A visually dramatic and poetic conceptual image based on the Urdu poem: "${quote}". Deep, nostalgic, inspiring atmosphere. High dynamic range, soft focus background, focus on emotions. Photorealistic style.`;
      
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}`;

      const message = `╔══════════════════╗\n` +
                      `  ✨ 𝑨𝑰 𝑸𝑼𝒑𝑯𝑨 & 𝑰𝑴𝑨𝑮𝑬 ✨  \n` +
                      `╚══════════════════╝\n\n` +
                      `📝 ${quote}\n\n` +
                      `👤 𝑶𝒘𝒏𝒆𝒓: 𝐒𝐡𝐚𝐚𝐧 𝐊𝐡𝐚𝐧`;

      // Step 3: Image stream karke bheinjein
      const stream = (await axios.get(imageUrl, { responseType: 'stream' })).data;
      
      return api.sendMessage({ body: message, attachment: stream }, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Error: API se connect nahi ho saka.", threadID, messageID);
    }
  }
};
