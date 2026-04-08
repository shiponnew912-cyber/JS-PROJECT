const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tik",
  version: "4.1",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Search and download TikTok videos",
  commandCategory: "media",
  usages: "<keyword or TikTok link>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  const react = (e) => api.setMessageReaction(e, event.messageID, event.threadID, () => {}, true);

  const input = args.join(" ");
  if (!input) return api.sendMessage("🎵 | Enter TikTok link or keyword", event.threadID);

  react("⏳");

  const cachePath = path.join(__dirname, "cache");
  if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

  const wait = await api.sendMessage("🔎 | Searching TikTok...", event.threadID);

  try {

    if (input.includes("tiktok.com")) {

      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(input)}`);

      if (!res.data || !res.data.data) throw new Error("API error");

      const videoUrl = res.data.data.play;
      const filePath = path.join(cachePath, `tiktok_${Date.now()}.mp4`);

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {

        await api.unsendMessage(wait.messageID);
        react("✅");

        api.sendMessage({
          body: "🎬 TikTok Video",
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));

      });

      return;
    }

    const res = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(input)}`);

    const videos = res.data?.data?.videos;

    if (!videos || videos.length === 0) {
      react("❌");
      await api.unsendMessage(wait.messageID);
      return api.sendMessage("❌ No videos found.", event.threadID);
    }

    const top10 = videos.slice(0, 10);

    let msg = "🎬 TikTok Search Results:\n\n";

    top10.forEach((v, i) => {
      msg += `${i + 1}. ${v.title || "No title"}\n👤 ${v.author.nickname}\n\n`;
    });

    msg += "👉 Reply with a number (1-10)";

    await api.unsendMessage(wait.messageID);
    react("✅");

    api.sendMessage(msg, event.threadID, (err, info) => {

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        results: top10
      });

    });

  } catch (err) {

    console.log(err);
    react("❌");

    await api.unsendMessage(wait.messageID);

    api.sendMessage("❌ TikTok API error", event.threadID);

  }

};

module.exports.handleReply = async function ({ api, event, handleReply }) {

  const react = (e) => api.setMessageReaction(e, event.messageID, event.threadID, () => {}, true);

  const { author, results, messageID } = handleReply;

  if (event.senderID !== author) return;

  const choice = parseInt(event.body);

  if (isNaN(choice) || choice < 1 || choice > results.length)
    return api.sendMessage("⚠️ Reply number 1-10", event.threadID);

  react("⏳");

  const selected = results[choice - 1];

  const cachePath = path.join(__dirname, "cache");
  const filePath = path.join(cachePath, `tiktok_${Date.now()}.mp4`);

  const response = await axios({
    method: "GET",
    url: selected.play,
    responseType: "stream"
  });

  const writer = fs.createWriteStream(filePath);

  response.data.pipe(writer);

  writer.on("finish", async () => {

    react("✅");

    api.sendMessage({
      body: `🎬 ${selected.title || "TikTok Video"}\n👤 ${selected.author.nickname}`,
      attachment: fs.createReadStream(filePath)
    }, event.threadID, async () => {

      fs.unlinkSync(filePath);
      await api.unsendMessage(messageID);

    });

  });

};
