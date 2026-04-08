const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "video",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Video download",
  commandCategory: "media",
  usages: "video <search>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {

  const react = (e) => api.setMessageReaction(e, event.messageID, () => {}, true);

  try {

    const query = args.join(" ");
    if (!query) return react("⚠️");

    react("🔍");

    const search = await yts(query);
    const list = search.videos.slice(0, 10);

    if (!list.length) return react("❌");

    let msg = "🎬 VIDEO LIST\n\n";

    list.forEach((v, i) => {
      msg += `${i + 1}. ${v.title}\n⏱ ${v.timestamp}\n\n`;
    });

    msg += "👉 Reply 1-10";

    const thumbs = await Promise.all(
      list.map(async (v) => {
        try {
          const r = await axios({ url: v.thumbnail, method: "GET", responseType: "stream" });
          return r.data;
        } catch {
          return null;
        }
      })
    );

    api.sendMessage(
      {
        body: msg,
        attachment: thumbs.filter(Boolean)
      },
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: "video",
          messageID: info.messageID,
          author: event.senderID,
          list
        });
      }
    );

  } catch {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {

  const react = (e) => api.setMessageReaction(e, event.messageID, () => {}, true);

  try {

    if (event.senderID !== handleReply.author) return;

    const index = parseInt(event.body);
    if (isNaN(index) || index < 1 || index > handleReply.list.length)
      return react("⚠️");

    const video = handleReply.list[index - 1];

    try { api.unsendMessage(handleReply.messageID); } catch {}

    react("⏳");

    const json = await axios.get(
      "https://raw.githubusercontent.com/SAGOR-OFFICIAL-09/api/refs/heads/main/ApiUrl.json"
    );

    const baseApi = json.data?.apis?.ytdl;
    if (!baseApi) return react("❌");

    const qualities = ["480p", "360p", "240p"];

    let downloadUrl = null;
    let usedQuality = "Unknown";
    let data = {};

    for (let q of qualities) {
      try {
        const apiUrl = `${baseApi}/api/ytmp4?url=${encodeURIComponent(video.url)}&quality=${q}`;
        const res = await axios.get(apiUrl, { timeout: 20000 });

        data = res.data;

        let url = data.downloadUrl || data.quality_list?.[q]?.url;

        if (!url && data.quality_list) {
          const firstKey = Object.keys(data.quality_list)[0];
          url = data.quality_list[firstKey]?.url;
          usedQuality = firstKey;
        } else {
          usedQuality = q;
        }

        if (!url) continue;

        downloadUrl = url;
        break;

      } catch {}
    }

    if (!downloadUrl) {
      return api.sendMessage("❌ API failed", event.threadID);
    }

    const stream = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    const filePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      stream.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await api.sendMessage(
      {
        body: `🎬 ${data.title || video.title}\n📺 ${data.channel || "Unknown"}\n📺 ${usedQuality}`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath)
    );

    react("✅");

  } catch (err) {
    console.log(err);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};
