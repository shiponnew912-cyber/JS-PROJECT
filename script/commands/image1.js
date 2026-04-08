const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

module.exports.config = {
  name: "gen",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "AI image generator",
  commandCategory: "ai",
  usages: "gen <prompt>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  const prompt = args.join(" ");
  if (!prompt)
    return api.sendMessage("❌ | Enter prompt", event.threadID, event.messageID);

  const loading = await api.sendMessage("⏳ Generating image...", event.threadID);

  try {

    let imgUrl = null;
    let tries = 0;

    while (!imgUrl && tries < 10) {
      tries++;

      try {
        const res = await axios.get(
          `https://nsfw-image-gen-nx.vercel.app/sagor?prompt=${encodeURIComponent(prompt)}`,
          { timeout: 120000 }
        );

        if (res.data && res.data.status === "success" && res.data.image) {
          imgUrl = res.data.image;
          break;
        }

      } catch {}

      await delay(60000);
    }

    if (!imgUrl) {
      api.unsendMessage(loading.messageID);
      return api.sendMessage("❌ | Server busy", event.threadID, event.messageID);
    }

    const filePath = path.join(__dirname, "cache", `${Date.now()}.png`);

    const response = await axios({
      url: imgUrl,
      method: "GET",
      responseType: "stream",
      timeout: 60000
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    api.unsendMessage(loading.messageID);

    api.sendMessage(
      {
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );

  } catch (e) {
    api.unsendMessage(loading.messageID);
    api.sendMessage("❌ | Failed", event.threadID, event.messageID);
  }
};
