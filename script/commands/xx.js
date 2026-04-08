module.exports.config = {
  name: "xx",
  version: "10.3.0",
  hasPermssion: 0,
  credits: "Sagor",
  description: "Search + image + download",
  commandCategory: "media",
  usages: "xx <text/link>",
  cooldowns: 5
};

const axios = require("axios");

const cleanUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\((https?:\/\/.*?)\)/);
  return match ? match[1] : url;
};

const streamURL = async (url) => {
  const res = await axios.get(url, { responseType: "stream" });
  return res.data;
};

const get360p = (downloads) => {
  if (!Array.isArray(downloads)) return null;
  const vid = downloads.find(v => v.quality === "360p");
  return vid ? cleanUrl(vid.url) : cleanUrl(downloads[0]?.url);
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  try {
    if (event.senderID != handleReply.author) return;

    const index = parseInt(event.body);
    if (!index || index < 1 || index > handleReply.list.length) return;

    const item = handleReply.list[index - 1];

    api.unsendMessage(handleReply.messageID);

    const res = await axios.get(
      `https://x-down-api-sagor.vercel.app/sagor?apikey=sagor&q=${encodeURIComponent(cleanUrl(item.url))}`
    );

    const data = res?.data?.data;
    if (!data) return api.sendMessage("❌ API data missing!", event.threadID);

    const videoUrl = get360p(data.downloads);
    if (!videoUrl) return api.sendMessage("❌ No video link!", event.threadID);

    const stream = await streamURL(videoUrl);

    return api.sendMessage({
      body: `📥 ${data.title}\n🎬 360p\n⏱ ${data.duration}`,
      attachment: stream
    }, event.threadID);

  } catch (err) {
    return api.sendMessage(`❌ Error: ${err.message}`, event.threadID);
  }
};

module.exports.run = async ({ api, event, args }) => {
  try {
    if (!args[0]) {
      return api.sendMessage("❌ Use: xx <text>", event.threadID);
    }

    const query = args.join(" ");

    const res = await axios.get(
      `https://x-search-api-sagor.vercel.app/sagor?apikey=sagor&q=${encodeURIComponent(query)}`
    );

    const list = res?.data?.data;

    if (!Array.isArray(list) || list.length === 0) {
      return api.sendMessage("❌ No result!", event.threadID);
    }

    const results = list.slice(0, 15).map(item => ({
      ...item,
      url: cleanUrl(item.url),
      thumbnail: cleanUrl(item.thumbnail)
    }));

    let msg = `🔎 ${query}\nReply number:\n\n`;

    results.forEach((item, i) => {
      msg += `${i + 1}. ${item.title}\n⏱ ${item.duration}\n\n`;
    });

    // 🔥 Load ALL images (safe)
    const images = [];
    for (let item of results) {
      try {
        const img = await streamURL(item.thumbnail);
        if (img) images.push(img);
      } catch {}
    }

    return api.sendMessage({
      body: msg,
      attachment: images
    }, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        list: results
      });
    });

  } catch (err) {
    return api.sendMessage(`❌ Error: ${err.message}`, event.threadID);
  }
};
