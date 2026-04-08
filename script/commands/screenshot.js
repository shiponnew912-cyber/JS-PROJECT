const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "ss",
  aliases: ["screenshot"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "Take HD mobile screenshot of a website",
  commandCategory: "utility",
  usages: "ss <url>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  if (!args[0]) {
    return api.sendMessage(
      "❌ | Please provide a URL!",
      event.threadID,
      event.messageID
    );
  }

  let url = args[0];
  if (!url.startsWith("http")) url = "https://" + url;

  const apiKey = "1e1458";
  const apiUrl = `https://api.screenshotmachine.com?key=${apiKey}&url=${encodeURIComponent(url)}&dimension=1080x1920&device=mobile&format=png`;

  const filePath = path.join(__dirname, "cache", `ss_${Date.now()}.png`);

  try {

    const response = await axios({
      url: apiUrl,
      method: "GET",
      responseType: "arraybuffer"
    });

    fs.writeFileSync(filePath, response.data);

    return api.sendMessage(
      {
        body: `📱 HD Mobile Screenshot\n🌐 ${url}`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );

  } catch (err) {
    return api.sendMessage(
      "❌ Failed to capture screenshot!\n" + err.message,
      event.threadID,
      event.messageID
    );
  }
};
