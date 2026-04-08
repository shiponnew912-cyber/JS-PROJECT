const axios = require("axios");

module.exports.config = {
  name: "pp",
  aliases: ["pfp"],
  version: "2.2.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Get profile picture",
  commandCategory: "utility",
  usages: "pp / pfp [@mention | reply | uid]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  let targetID;

  if (event.mentions && Object.keys(event.mentions).length > 0) {
    targetID = Object.keys(event.mentions)[0];
  } 
  else if (event.messageReply) {
    targetID = event.messageReply.senderID;
  } 
  else if (args[0] && !isNaN(args[0])) {
    targetID = args[0];
  } 
  else {
    targetID = event.senderID;
  }

  try {

    const url = `https://graph.facebook.com/${targetID}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

    const stream = await axios({
      url,
      method: "GET",
      responseType: "stream"
    });

    return api.sendMessage(
      {
        body: `📷 Profile Picture\n👤 UID: ${targetID}`,
        attachment: stream.data
      },
      event.threadID,
      event.messageID
    );

  } catch (e) {
    return api.sendMessage(
      "❌ Failed to get profile picture",
      event.threadID,
      event.messageID
    );
  }
};
