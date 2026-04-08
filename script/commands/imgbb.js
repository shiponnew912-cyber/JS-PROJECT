const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "imgbb",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Upload image(s) to imgbb",
  commandCategory: "uploader",
  usages: "reply to image",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {

  const imgbbApiKey = "1b4d99fa0c3195efe42ceb62670f2a25";

  const attachments = event.messageReply?.attachments?.filter(att =>
    ["photo", "sticker", "animated_image"].includes(att.type)
  );

  if (!attachments || attachments.length === 0) {
    return api.sendMessage(
      "❌ | Reply to one or more images.",
      event.threadID,
      event.messageID
    );
  }

  try {
    const uploadedLinks = await Promise.all(
      attachments.map(async (attachment, index) => {

        const response = await axios.get(attachment.url, {
          responseType: "arraybuffer"
        });

        const formData = new FormData();
        formData.append(
          "image",
          Buffer.from(response.data, "binary"),
          { filename: `image${index}.jpg` }
        );

        const res = await axios.post(
          "https://api.imgbb.com/1/upload",
          formData,
          {
            headers: formData.getHeaders(),
            params: { key: imgbbApiKey }
          }
        );

        return res.data.data.url;
      })
    );

    return api.sendMessage(
      uploadedLinks.join("\n"),
      event.threadID,
      event.messageID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage(
      "❌ | Upload failed.",
      event.threadID,
      event.messageID
    );
  }
};
