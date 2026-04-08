const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "rbg",
  aliases: [],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "Remove image background",
  commandCategory: "image",
  usages: "reply image",
  cooldowns: 10
};

module.exports.run = async function ({ api, event }) {

  try {
    if (!event.messageReply || !event.messageReply.attachments?.[0]) {
      return api.sendMessage(
        "Reply to an image\nExample:\nremovebg",
        event.threadID,
        event.messageID
      );
    }

    const imgUrl = event.messageReply.attachments[0].url;

    const apiUrl = `https://rbg-api-by-sagor.vercel.app/api/removebg?image_url=${encodeURIComponent(imgUrl)}`;

    await api.sendMessage("⏳ Removing background...", event.threadID);

    const res = await axios.get(apiUrl);

    if (!res.data || res.data.status !== "success") {
      return api.sendMessage("❌ Error removing background", event.threadID);
    }

    const base64 = res.data.data.image_base64;
    const buffer = Buffer.from(base64, "base64");

    const filePath = path.join(
      __dirname,
      "cache",
      `removebg_${Date.now()}.png`
    );

    await fs.outputFile(filePath, buffer);

    return api.sendMessage(
      {
        body: "✅ Background Removed Successfully\n🤖 SAGOR API",
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath)
    );

  } catch (err) {
    return api.sendMessage(
      "❌ Server error!",
      event.threadID,
      event.messageID
    );
  }
};
