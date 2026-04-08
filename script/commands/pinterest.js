const axios = require("axios");

module.exports.config = {
  name: "pin",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "Pinterest image search",
  commandCategory: "image",
  usages: "pin <query>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  if (!args.length) {
    return api.sendMessage(
      "❌ | Please enter a search query.",
      event.threadID,
      event.messageID
    );
  }

  const query = args.join(" ");

  try {

    const json = await axios.get(
      "https://raw.githubusercontent.com/SAGOR-OFFICIAL-09/api/refs/heads/main/ApiUrl.json"
    );

    const apiBase = json.data.apis.pinterest;

    const apiUrl = `${apiBase}/sagor?q=${encodeURIComponent(query)}&limit=10&apikey=sagor`;

    const res = await axios.get(apiUrl);

    const images = res.data.images;

    if (!images || images.length === 0) {
      return api.sendMessage(
        "❌ | No images found.",
        event.threadID,
        event.messageID
      );
    }

    const attachments = [];

    for (const img of images) {
      const stream = await axios({
        url: img,
        method: "GET",
        responseType: "stream"
      });

      attachments.push(stream.data);
    }

    return api.sendMessage(
      {
        body: `📌 Pinterest results for: ${query}`,
        attachment: attachments
      },
      event.threadID,
      event.messageID
    );

  } catch (err) {
    return api.sendMessage(
      "❌ | Failed to fetch images.",
      event.threadID,
      event.messageID
    );
  }
};
