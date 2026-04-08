module.exports.config = {
  name: "4k",
  version: "1.0.4",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "Upscale image",
  commandCategory: "media",
  usages: "reply image",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  try {
    if (
      event.type !== "message_reply" ||
      !event.messageReply.attachments ||
      event.messageReply.attachments.length === 0
    ) {
      return api.sendMessage("Reply to an image.", event.threadID, event.messageID);
    }

    const attachment = event.messageReply.attachments[0];

    if (attachment.type !== "photo") {
      return api.sendMessage("❌ Only images supported.", event.threadID, event.messageID);
    }

    const imageUrl = attachment.url;

    let msgID;
    await new Promise(resolve => {
      api.sendMessage("⏳ Processing...", event.threadID, (err, info) => {
        msgID = info.messageID;
        resolve();
      }, event.messageID);
    });

    const apiUrl = `https://4k-api-nx.vercel.app/sagor?image_url=${encodeURIComponent(imageUrl)}&scale=2`;

    const res = await axios.get(apiUrl);

    if (!res.data || res.data.status !== "success") {
      api.unsendMessage(msgID);
      return api.sendMessage("❌ API failed.", event.threadID, event.messageID);
    }

    const filePath = path.join(__dirname, "cache", `4k_${Date.now()}.jpg`);
    const img = (await axios.get(res.data.data.image, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(filePath, Buffer.from(img));

    api.unsendMessage(msgID);

    return api.sendMessage(
      {
        body: `✅ Done\n🔍 ${res.data.data.scale}`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );

  } catch (e) {
    return api.sendMessage("❌ Error", event.threadID, event.messageID);
  }
};
