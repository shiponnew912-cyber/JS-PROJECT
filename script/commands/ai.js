const axios = require("axios");

const memory = new Map();
const replyMap = new Map();

function detectLang(text) {
  const hasBn = /[\u0980-\u09FF]/.test(text);
  const hasEn = /[a-zA-Z]/.test(text);
  if (hasBn && hasEn) return "mix";
  if (hasBn) return "bn";
  return "en";
}

function buildPrompt(history, lang) {
  let system;

  if (lang === "bn") system = "Reply short in Bangla.";
  else if (lang === "mix") system = "Reply short in Banglish.";
  else system = "Reply short in English.";

  return (
    system +
    "\n\n" +
    history.map(x => `${x.role === "user" ? "User" : "Assistant"}: ${x.content}`).join("\n") +
    "\nAssistant:"
  );
}

function cleanReply(text) {
  if (!text) return "⚠️ AI busy";

  return text
    .replace(/^"+|"+$/g, "")
    .replace(/\\n/g, " ")
    .replace(/\\/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAI(prompt) {
  try {
    const res = await axios.get("https://ai-api-sagor.vercel.app/sagor", {
      params: { key: "sagor", prompt },
      timeout: 15000
    });
    return res.data;
  } catch {
    return null;
  }
}

module.exports.config = {
  name: "ai",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SAGOR",
  description: "AI chat with memory + reply system",
  commandCategory: "ai",
  usages: "[text]",
  cooldowns: 5
};

// command run
module.exports.run = async function ({ api, event, args }) {
  const user = event.senderID;
  const text = args.join(" ");
  if (!text) return api.sendMessage("❌ | Enter text", event.threadID);

  const lang = detectLang(text);
  let history = memory.get(user) || [];

  history.push({ role: "user", content: text });
  if (history.length > 3) history.shift();

  const data = await fetchAI(buildPrompt(history, lang));
  if (!data) return api.sendMessage("❌ | API Down", event.threadID);

  let reply = cleanReply(
    data.reply || data.data?.response || data.message || "⚠️ AI busy"
  );

  history.push({ role: "ai", content: reply });
  memory.set(user, history);

  api.sendMessage(
    reply,
    event.threadID,
    (err, info) => {
      replyMap.set(info.messageID, true);
    },
    event.messageID
  );
};

// auto reply (handleEvent)
module.exports.handleEvent = async function ({ api, event }) {
  const text = event.body;
  if (!text) return;

  const replyID = event.messageReply?.messageID;
  if (!replyID) return;
  if (!replyMap.has(replyID)) return;

  const user = event.senderID;
  const lang = detectLang(text);

  let history = memory.get(user) || [];

  history.push({ role: "user", content: text });
  if (history.length > 3) history.shift();

  const data = await fetchAI(buildPrompt(history, lang));
  if (!data) return;

  let reply = cleanReply(
    data.reply || data.data?.response || data.message || "⚠️ AI busy"
  );

  history.push({ role: "ai", content: reply });
  memory.set(user, history);

  api.sendMessage(
    reply,
    event.threadID,
    (err, info) => {
      replyMap.set(info.messageID, true);
    },
    event.messageID
  );
};
