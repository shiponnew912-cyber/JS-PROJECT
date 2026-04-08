const fs = require("fs-extra");

/* ================= CONFIG ================= */

module.exports.config = {
  name: "cache",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "SaGor",
  description: "Delete files or folders inside cache (System Mode)",
  commandCategory: "Admin-bot system",
  usages: "cache / cache start <text> / cache ext <text> / cache <text> / cache help",
  cooldowns: 5
};

/* ================= SYSTEM BOX ================= */

const systemBox = (title, body) =>
`╭───〔 ${title} 〕───╮

${body}

╰────────────────────╯`;

/* ================= HANDLE REPLY ================= */

module.exports.handleReply = ({ api, event, handleReply }) => {
  if (event.senderID != handleReply.author) return;

  let nums = event.body.split(" ").map(n => parseInt(n));
  let msg = "";

  for (let num of nums) {
    let target = handleReply.files[num - 1];
    if (!target) continue;

    let fullPath = __dirname + "/cache/" + target;
    let stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      msg += `🗂️ Folder Deleted : ${target}\n`;
    } else {
      fs.unlinkSync(fullPath);
      msg += `📄 File Deleted   : ${target}\n`;
    }
  }

  api.sendMessage(
    systemBox("🧹 CACHE CLEAN RESULT", msg || "Nothing deleted."),
    event.threadID,
    event.messageID
  );
};

/* ================= MAIN RUN ================= */

module.exports.run = async function ({ api, event, args }) {

  const ADMIN = ["61581197276223"];
  if (!ADMIN.includes(event.senderID))
    return api.sendMessage(
      systemBox("⛔ ACCESS DENIED", "This command is only for Bot Admins."),
      event.threadID,
      event.messageID
    );

  let files = fs.readdirSync(__dirname + "/cache") || [];
  let msg = "";
  let i = 1;

  /* ===== HELP ===== */
  if (args[0] === "help") {
    return api.sendMessage(
      systemBox(
        "📘 CACHE COMMAND HELP",
        `cache
→ Show all cache files

cache start <text>
→ Files starting with text

cache ext <ext>
→ Files ending with extension

cache <text>
→ Files containing text

Reply with numbers to delete`
      ),
      event.threadID,
      event.messageID
    );
  }

  /* ===== FILTER START ===== */
  if (args[0] === "start" && args[1]) {
    let word = args.slice(1).join(" ");
    files = files.filter(f => f.startsWith(word));
    if (!files.length)
      return api.sendMessage(
        systemBox("❌ NO RESULT", `No cache files start with: ${word}`),
        event.threadID,
        event.messageID
      );
  }

  /* ===== FILTER EXT ===== */
  else if (args[0] === "ext" && args[1]) {
    let ext = args[1];
    files = files.filter(f => f.endsWith(ext));
    if (!files.length)
      return api.sendMessage(
        systemBox("❌ NO RESULT", `No cache files end with: ${ext}`),
        event.threadID,
        event.messageID
      );
  }

  /* ===== FILTER NAME ===== */
  else if (args[0]) {
    let word = args.join(" ");
    files = files.filter(f => f.includes(word));
    if (!files.length)
      return api.sendMessage(
        systemBox("❌ NO RESULT", `No cache files contain: ${word}`),
        event.threadID,
        event.messageID
      );
  }

  /* ===== EMPTY CACHE ===== */
  if (!files.length)
    return api.sendMessage(
      systemBox("📂 CACHE STATUS", "Cache folder is empty."),
      event.threadID,
      event.messageID
    );

  /* ===== LIST FILES ===== */
  for (let file of files) {
    let stat = fs.statSync(__dirname + "/cache/" + file);
    msg += `${i++}. ${stat.isDirectory() ? "🗂️ Folder" : "📄 File"} : ${file}\n`;
  }

  api.sendMessage(
    systemBox(
      "🧹 CACHE FILE LIST",
      `Reply with numbers (space separated) to delete:\n\n${msg}`
    ),
    event.threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: event.senderID,
        files
      });
    }
  );
};
