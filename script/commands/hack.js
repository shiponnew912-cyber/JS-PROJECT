const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "hack",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Just for fun",
  commandCategory: "fun",
  usages: "[UID/mention/reply]",
  cooldowns: 5
};

async function wrapText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width < maxWidth) return [text];
  const words = text.split(" ");
  const lines = [];
  let line = "";

  while (words.length > 0) {
    if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) {
      line += `${words.shift()} `;
    } else {
      lines.push(line.trim());
      line = "";
    }
  }

  if (line) lines.push(line.trim());
  return lines;
}

async function hackMessage(api, event, name) {
  try {
    const loadingMessage = await api.sendMessage(
      `Hacking Facebook Password for ${name}, Please wait...`,
      event.threadID
    );

    if (!loadingMessage || !loadingMessage.messageID) return null;

    const id = loadingMessage.messageID;

    await new Promise(r => setTimeout(r, 3000));
    await api.editMessage(
      `Successfully Cracked Facebook password for *${name}*`,
      id
    );

    await new Promise(r => setTimeout(r, 3000));
    await api.editMessage(
      `Login failed! 2FA is enabled on *${name}*'s account.`,
      id
    );

    await new Promise(r => setTimeout(r, 3000));
    await api.editMessage(
      `2FA Bypass Successful! Logged into *${name}*'s account.`,
      id
    );

    return id;

  } catch {
    return null;
  }
}

module.exports.run = async function ({ api, event, args }) {
  try {
    const pathImg = __dirname + "/cache/background.png";
    const pathAvt = __dirname + "/cache/Avtmot.png";

    let id;

    if (event.messageReply) {
      id = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      id = Object.keys(event.mentions)[0];
    } else if (args[0]) {
      id = args[0];
    } else {
      id = event.senderID;
    }

    let userInfo;
    try {
      userInfo = await api.getUserInfo(id);
    } catch {
      return api.sendMessage("❌ Unable to fetch user information.", event.threadID, event.messageID);
    }

    const name = userInfo[id]?.name || "Unknown User";

    const msgID = await hackMessage(api, event, name);

    const bgURL = "https://i.ibb.co/DCLzrQQ/VQXViKI.png";

    let avt, bg;
    try {
      avt = (await axios.get(
        `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;

      bg = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;

      fs.writeFileSync(pathAvt, Buffer.from(avt));
      fs.writeFileSync(pathImg, Buffer.from(bg));
    } catch {
      return api.sendMessage("❌ Image generation failed.", event.threadID, event.messageID);
    }

    const base = await loadImage(pathImg);
    const avatar = await loadImage(pathAvt);

    const canvas = createCanvas(base.width, base.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(base, 0, 0);
    ctx.drawImage(avatar, 83, 437, 100, 101);

    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#1878F3";

    const lines = await wrapText(ctx, name, 1160);
    ctx.fillText(lines.join("\n"), 200, 497);

    fs.writeFileSync(pathImg, canvas.toBuffer());
    fs.removeSync(pathAvt);

    if (msgID) await api.unsendMessage(msgID);

    return api.sendMessage(
      {
        body: `Successfully hacked ${name}\nPlease check your inbox to get Number and Password`,
        attachment: fs.createReadStream(pathImg)
      },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );

  } catch {
    api.sendMessage("❌ Error occurred.", event.threadID, event.messageID);
  }
};
