// ================= CREATOR LOCK =================
const CREATOR_LOCK = (() => {
  const encoded = "U2FHb3I="; 
  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
  name: "out",
  version: "3.0.0",
  hasPermssion: 2,
  credits: "SaGor",
  description: "BOT leaves group",
  commandCategory: "group",
  usages: "out / buk out / nikal / group out",
  cooldowns: 10,
  usePrefix: false
};

const triggers = [
  "out",
  "buk out",
  "nikal",
  "group out",
  "bhosdi ke nikal"
];

// 🔐 Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ Creator Lock Activated! Credits cannot be changed.");
  module.exports.run = () => {};
  module.exports.handleEvent = () => {};
  return;
}

async function leaveGroup(api, threadID) {
  await api.sendMessage("Boss, I am leaving 👋", threadID);
  return api.removeUserFromGroup(api.getCurrentUserID(), threadID);
}

/* ================= MAIN (No Prefix Only) ================= */

module.exports.run = async function ({ api, event }) {
  return leaveGroup(api, event.threadID);
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!event.body) return;

  const body = event.body.toLowerCase().trim();

  if (triggers.includes(body)) {
    return leaveGroup(api, event.threadID);
  }
};
