const axios = require("axios");

const API_KEY = "sagor";
const API_JSON = "https://raw.githubusercontent.com/SAGOR-OFFICIAL-09/api/main/ApiUrl.json";

module.exports.config = {
  name: "emojimix",
  version: "6.1.0",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "Emoji mix",
  commandCategory: "fun",
  usages: "{prefix}emojimix 🤫👎",
  cooldowns: 5
};

async function mixEmoji(api, threadID, messageID, args) {
  let e1, e2;

  if (args.length === 1) {
    const emojis = [...args[0]];
    if (emojis.length < 2)
      return api.sendMessage("❌ | Provide two emojis.", threadID, messageID);

    e1 = emojis[0];
    e2 = emojis[1];
  } else {
    e1 = args[0];
    e2 = args[1];
  }

  try {
    const json = await axios.get(API_JSON);
    const base = json.data.apis.emojimix;

    const apiUrl = `${base}/sagor?emoji1=${encodeURIComponent(e1)}&emoji2=${encodeURIComponent(e2)}&apikey=${API_KEY}`;

    const res = await axios.get(apiUrl);

    const imgUrl = res.data?.data?.[0]?.image;
    if (!imgUrl) {
      return api.sendMessage("❌ | Emoji mix not found.", threadID, messageID);
    }

    const stream = await axios({
      url: imgUrl,
      method: "GET",
      responseType: "stream"
    });

    return api.sendMessage({
      body: `✨ Emoji Mix\n${e1} + ${e2}`,
      attachment: stream.data
    }, threadID, messageID);

  } catch {
    return api.sendMessage("❌ | API failed.", threadID, messageID);
  }
}

module.exports.run = async function ({ api, event, args }) {
  const prefix = global.config?.PREFIX || "!";

  if (!args.length) {
    return api.sendMessage(
      `Use: ${prefix}emojimix 🤫👎`,
      event.threadID,
      event.messageID
    );
  }

  return mixEmoji(api, event.threadID, event.messageID, args);
};
