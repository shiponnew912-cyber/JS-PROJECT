const CREATOR_NAME = "SaGor";

module.exports.config = {
  name: "uns",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Message ko unsend kare (prefix + no prefix)",
  commandCategory: "system",
  usages: "reply + uns / 👍 / unsend / #uns",
  cooldowns: 0,
  usePrefix: true 
};

// 🔒 CREDIT PROTECTION
if (module.exports.config.credits !== CREATOR_NAME) {
  throw new Error("Credits change");
}

module.exports.languages = {
  hi: {
    returnCant: "📌 You cannot unsend a message sent by someone else. 😉",
    missingReply: "📌 Please reply to the message you want to unsend. 😉"
  }
};

/* ========= NO PREFIX SUPPORT ========= */
module.exports.handleEvent = async function ({ api, event, getText }) {
  try {
    if (!event.body || event.type !== "message_reply") return;

    const body = event.body.toLowerCase();

    if (
      body === "uns" ||
      body === "unsend" ||
      body === "👍" ||
      body === "🤦" ||
      body === "."
    ) {

      if (event.messageReply.senderID !== api.getCurrentUserID()) {
        return api.sendMessage(
          getText("returnCant"),
          event.threadID,
          event.messageID
        );
      }

      return api.unsendMessage(event.messageReply.messageID);
    }

  } catch (e) {
    console.log("UNSEND ERROR:", e);
  }
};

/* ========= PREFIX COMMAND ========= */
module.exports.run = function ({ api, event, getText }) {

  if (event.type !== "message_reply") {
    return api.sendMessage(
      getText("missingReply"),
      event.threadID,
      event.messageID
    );
  }

  if (event.messageReply.senderID !== api.getCurrentUserID()) {
    return api.sendMessage(
      getText("returnCant"),
      event.threadID,
      event.messageID
    );
  }

  return api.unsendMessage(event.messageReply.messageID);
};
