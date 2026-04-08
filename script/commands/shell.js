const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const ROOT_DIR = process.cwd();
const MAX_FILE_SIZE = 250 * 1024;
const MAX_MESSAGE_LENGTH = 12000;

const ALLOWED_EXTENSIONS = new Set([
  ".js", ".json", ".txt", ".md", ".ts", ".html", ".css", ".yml", ".yaml"
]);

const BLOCKED_NAMES = new Set([
  ".env","appstate.json","token.json","tokens.json",
  "session.json","sessions.json","cookies.json",
  "credential.json","credentials.json"
]);

const BLOCKED_EXTENSIONS = new Set([
  ".db",".sqlite",".sqlite3",".pem",".key",".crt",".exe",".dll",".so",".bin"
]);

function safeResolve(relPath = ".") {
  const abs = path.resolve(ROOT_DIR, relPath);
  if (abs !== ROOT_DIR && !abs.startsWith(ROOT_DIR + path.sep))
    throw new Error("Access denied");
  return abs;
}

function isBlockedFile(name) {
  const lower = name.toLowerCase();
  if (BLOCKED_NAMES.has(lower)) return true;
  if (BLOCKED_EXTENSIONS.has(path.extname(lower))) return true;
  return false;
}

function isAllowedFile(name) {
  const lower = name.toLowerCase();
  if (isBlockedFile(lower)) return false;
  return ALLOWED_EXTENSIONS.has(path.extname(lower));
}

async function getItems(relPath = ".") {
  const absPath = safeResolve(relPath);
  const dirents = await fsp.readdir(absPath, { withFileTypes: true });

  return dirents
    .filter(item => item.isDirectory() || isAllowedFile(item.name))
    .map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      relPath: path.join(relPath, item.name)
    }))
    .sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
}

function formatList(relPath, items) {
  const current = relPath === "." ? "/" : "/" + relPath.replace(/\\/g, "/");
  let msg = `📂 Path: ${current}\n\n`;

  if (relPath !== ".") msg += "0. 🔙 Back\n";

  msg += items.map((item, i) =>
    `${i + 1}. ${item.isDirectory ? "📁" : "📄"} ${item.name}`
  ).join("\n");

  msg += "\n\nReply number | d1 | d1,2,3";
  return msg;
}

async function sendList(api, threadID, messageID, commandName, author, relPath = ".") {
  const items = await getItems(relPath);
  const body = formatList(relPath, items);

  api.sendMessage(body, threadID, (err, info) => {
    if (err) return;

    global.client.handleReply.push({
      name: commandName,
      messageID: info.messageID,
      author,
      relPath,
      items
    });
  }, messageID);
}

async function sendFileContent(api, threadID, filePath, fileName) {
  const stat = await fsp.stat(filePath);

  if (stat.size > MAX_FILE_SIZE) {
    return api.sendMessage(`❌ File too large\n${fileName}`, threadID);
  }

  const content = await fsp.readFile(filePath, "utf8");

  if (content.length > MAX_MESSAGE_LENGTH) {
    return api.sendMessage(`❌ File too long\n${fileName}`, threadID);
  }

  return api.sendMessage(`📄 ${fileName}\n\n${content}`, threadID);
}

module.exports.config = {
  name: "shell",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "SaGor",
  description: "Browse + delete system",
  commandCategory: "system",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  return sendList(api, event.threadID, event.messageID, "shell", event.senderID, ".");
};

module.exports.handleReply = async function ({ api, event, handleReply }) {

  if (String(event.senderID) !== String(handleReply.author))
    return api.sendMessage("❌ No permission", event.threadID);

  const input = String(event.body || "").trim();

  // 🔥 MULTI DELETE
  if (/^d[\d,\s]+$/.test(input)) {

    const numbers = input.slice(1).split(/[\s,]+/).map(Number);

    const selected = numbers.map(n => handleReply.items[n - 1]).filter(Boolean);

    if (!selected.length)
      return api.sendMessage("❌ Invalid selection", event.threadID);

    const paths = selected.map(i => safeResolve(i.relPath));

    return api.sendMessage(
      `⚠️ Confirm delete (${selected.length})\n\n${selected.map(i => i.name).join("\n")}\n\nReply: yes / no`,
      event.threadID,
      (err, info) => {
        global.client.handleReply.push({
          name: "shell",
          messageID: info.messageID,
          author: event.senderID,
          type: "confirmDelete",
          paths
        });
      }
    );
  }

  // 🔥 CONFIRM DELETE
  if (handleReply.type === "confirmDelete") {
    if (input.toLowerCase() === "yes") {
      for (const p of handleReply.paths) {
        fs.rmSync(p, { recursive: true, force: true });
      }
      return api.sendMessage("✅ Deleted", event.threadID);
    } else {
      return api.sendMessage("❌ Cancelled", event.threadID);
    }
  }

  if (!/^\d+$/.test(input))
    return api.sendMessage("❌ Invalid input", event.threadID);

  const choice = Number(input);

  if (handleReply.relPath !== "." && choice === 0) {
    const parent = path.dirname(handleReply.relPath);
    return sendList(api, event.threadID, event.messageID, "shell", event.senderID, parent === "" ? "." : parent);
  }

  const selected = handleReply.items[choice - 1];
  if (!selected)
    return api.sendMessage("❌ Not found", event.threadID);

  const absPath = safeResolve(selected.relPath);
  const stat = await fsp.stat(absPath);

  if (stat.isDirectory()) {
    return sendList(api, event.threadID, event.messageID, "shell", event.senderID, selected.relPath);
  }

  return sendFileContent(api, event.threadID, absPath, selected.name);
};
