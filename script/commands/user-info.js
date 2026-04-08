module.exports.config = {
  name: "userinf",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Get Facebook profile picture + full user info",
  commandCategory: "AI",
  cooldowns: 0
};

module.exports.run = async function({ event, api, args }) {
  const fs = require("fs-extra");
  const request = require("request");
  const axios = require("axios");

  const cachePath = __dirname + "/cache/";
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

  let uid;

  try {
    if (event.type === "message_reply") {
      uid = event.messageReply.senderID;
    }
    else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    }
    else if (args[0] && args[0].includes(".com/")) {
      uid = await api.getUID(args[0]);
    }
    else {
      uid = event.senderID;
    }

    // Basic info
    const userInfo = await api.getUserInfo(uid);
    const info = userInfo[uid];

    const name = info.name || "Unknown";
    const firstName = info.firstName || name.split(" ")[0];
    const friend = info.isFriend ? "Yes ❤️" : "No 💔";

    // 🔥 FIXED GENDER (Graph API)
    let gender = "Unknown";

    try {
      const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";
      const res = await axios.get(
        `https://graph.facebook.com/${uid}?fields=gender&access_token=${token}`
      );

      if (res.data.gender === "male") gender = "Male ♂";
      else if (res.data.gender === "female") gender = "Female ♀";
    } catch (e) {
      gender = "Private ❌";
    }

    const callback = () => {
      api.sendMessage(
        {
          body:
`╭─────────────────────────────╮
      👤 𝗨𝗦𝗘𝗥 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡
╰─────────────────────────────╯

🆔 𝗜𝗗: ${uid}
📛 𝗡𝗮𝗺𝗲: ${name}
🧑 𝗙𝗶𝗿𝘀𝘁 𝗡𝗮𝗺𝗲: ${firstName}
⚧ 𝗚𝗲𝗻𝗱𝗲𝗿: ${gender}
🤝 𝗙𝗿𝗶𝗲𝗻𝗱: ${friend}

┗━━━━━━━━━━━━━━━━┛`,
          attachment: fs.createReadStream(cachePath + "1.png")
        },
        event.threadID,
        () => fs.unlinkSync(cachePath + "1.png"),
        event.messageID
      );
    };

    const profileUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    request(encodeURI(profileUrl))
      .pipe(fs.createWriteStream(cachePath + "1.png"))
      .on("close", () => callback());

  } catch (err) {
    console.log(err);
    return api.sendMessage("❌ please mention baby !", event.threadID, event.messageID);
  }
};
