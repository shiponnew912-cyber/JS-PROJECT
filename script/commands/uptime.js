const os = require("os");

module.exports.config = {
  name: "uptime",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "System status",
  commandCategory: "system",
  cooldowns: 5,
  aliases: ["upt", "up"]
};

module.exports.run = async function({ api, event }) {
  try {
    const start = Date.now();

    const t = process.uptime();
    const time = `${Math.floor(t/86400)}d ${Math.floor(t%86400/3600)}h ${Math.floor(t%3600/60)}m ${Math.floor(t%60)}s`;

    const totalMem = os.totalmem()/1024/1024/1024;
    const freeMem = os.freemem()/1024/1024/1024;
    const usedMem = totalMem - freeMem;

    const cpuInfo = os.cpus();
    const cpu = cpuInfo[0].model;
    const cores = cpuInfo.length;

    const platform = os.platform();
    const release = os.release();
    const nodeVersion = process.version;

    const ping = Date.now() - start;

    const msg =
`╭─❍ 「 SYSTEM STATUS 」
│
│ ⏱️ Uptime: ${time}
│ 📶 Ping: ${ping} ms
│
│ 💾 RAM:
│ • Used: ${usedMem.toFixed(2)} GB
│ • Free: ${freeMem.toFixed(2)} GB
│ • Total: ${totalMem.toFixed(2)} GB
│
│ 🧠 CPU:
│ • ${cpu}
│ • Cores: ${cores}
│
│ 💻 System:
│ • ${platform} (${release})
│ • Node: ${nodeVersion}
│
╰───────────────❍`;

    return api.sendMessage(msg, event.threadID, event.messageID);

  } catch {
    return api.sendMessage("Error", event.threadID, event.messageID);
  }
};