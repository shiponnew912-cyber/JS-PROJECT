const fs = require("fs-extra");
const { resolve } = require("path");

/* ================= SYSTEM BOX DESIGN ================= */

function systemBox(title, text) {
  return `╭─── ${title} ───╮\n\n${text}\n\n╰─────────────────╯`;
}

const ADMIN_BOX = (text) => systemBox("🎀 〔 ADMIN SYSTEM 〕", text);
const SECURITY_BOX = (text) => systemBox("🔥 〔 SECURITY MODE 〕", text);
const BOT_BOX = (text) => systemBox("🤖 〔 BOT STATUS 〕", text);

/* ================= CONFIG ================= */

module.exports.config = {
  name: "admin",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Admin / Security / Bot Manager",
  commandCategory: "Admin",
  usages: "admin",
  cooldowns: 3
};

/* ================= LANG ================= */

module.exports.languages = {
  en: {
    noPerm: "You don't have permission to use this command"
  }
};

/* ================= ON LOAD ================= */

module.exports.onLoad = () => {
  const path = resolve(__dirname, "cache", "data.json");
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ adminbox: {} }, null, 4));
  }
};

/* ================= RUN ================= */

module.exports.run = async function ({
  api,
  event,
  args,
  Users,
  permssion
}) {
  const { threadID, messageID, mentions } = event;
  const configPath = global.client.configPath;

  delete require.cache[require.resolve(configPath)];
  const config = require(configPath);

  config.ADMINBOT = config.ADMINBOT || [];
  config.NDH = config.NDH || [];

  const mentionIDs = Object.keys(mentions || {});

  /* ================= HELP MENU ================= */

  if (!args[0]) {
    return api.sendMessage(
      ADMIN_BOX(
        "ADMIN COMMANDS\n\n" +
          "• admin list\n" +
          "• admin add @tag / reply\n" +
          "• admin remove @tag / reply\n" +
          "• admin addndh @tag\n" +
          "• admin removendh @tag\n" +
          "• admin only\n" +
          "• admin qtvonly"
      ),
      threadID,
      messageID
    );
  }

  /* ================= SWITCH ================= */

  switch (args[0]) {
    /* ===== LIST ===== */
    case "list": {
      let adminText = "";
      let ndhText = "";

      for (const id of config.ADMINBOT) {
        const name = (await Users.getData(id)).name || id;
        adminText += `• ${name} (${id})\n`;
      }

      for (const id of config.NDH) {
        const name = (await Users.getData(id)).name || id;
        ndhText += `• ${name} (${id})\n`;
      }

      return api.sendMessage(
        BOT_BOX(
          "👑 ADMINS\n" +
            (adminText || "None") +
            "\n🤖 SUPPORT\n" +
            (ndhText || "None")
        ),
        threadID,
        messageID
      );
    }

    /* ===== ADD ADMIN ===== */
    case "add": {
      if (permssion != 3)
        return api.sendMessage(
          SECURITY_BOX("Permission Denied ❌"),
          threadID,
          messageID
        );

      const ids =
        mentionIDs.length > 0
          ? mentionIDs
          : event.messageReply
          ? [event.messageReply.senderID]
          : [];

      if (!ids.length) return;

      for (const id of ids) {
        if (!config.ADMINBOT.includes(id)) config.ADMINBOT.push(id);
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

      return api.sendMessage(
        ADMIN_BOX(`Successfully added ${ids.length} Admin(s) ✅`),
        threadID,
        messageID
      );
    }

    /* ===== REMOVE ADMIN ===== */
    case "remove": {
      if (permssion != 3)
        return api.sendMessage(
          SECURITY_BOX("Permission Denied ❌"),
          threadID,
          messageID
        );

      const ids =
        mentionIDs.length > 0
          ? mentionIDs
          : event.messageReply
          ? [event.messageReply.senderID]
          : [];

      for (const id of ids) {
        const index = config.ADMINBOT.indexOf(id);
        if (index !== -1) config.ADMINBOT.splice(index, 1);
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

      return api.sendMessage(
        ADMIN_BOX(`Successfully removed ${ids.length} Admin(s) ❌`),
        threadID,
        messageID
      );
    }

    /* ===== ADD NDH ===== */
    case "addndh": {
      if (permssion != 3) return;

      for (const id of mentionIDs) {
        if (!config.NDH.includes(id)) config.NDH.push(id);
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

      return api.sendMessage(
        ADMIN_BOX(`Added ${mentionIDs.length} Support(s) 🤖`),
        threadID,
        messageID
      );
    }

    /* ===== REMOVE NDH ===== */
    case "removendh": {
      if (permssion != 3) return;

      for (const id of mentionIDs) {
        const index = config.NDH.indexOf(id);
        if (index !== -1) config.NDH.splice(index, 1);
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

      return api.sendMessage(
        ADMIN_BOX(`Removed ${mentionIDs.length} Support(s) ❌`),
        threadID,
        messageID
      );
    }

    /* ===== ADMIN ONLY ===== */
    case "only": {
      if (permssion != 3)
        return api.sendMessage(
          SECURITY_BOX("Permission Denied ❌"),
          threadID,
          messageID
        );

      config.adminOnly = !config.adminOnly;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

      return api.sendMessage(
        SECURITY_BOX(
          config.adminOnly
            ? "Admin Only Mode ENABLED 🔒"
            : "Admin Only Mode DISABLED 🔓"
        ),
        threadID,
        messageID
      );
    }

    /* ===== QTV ONLY (GROUP ADMIN) ===== */
    case "qtvonly": {
      const dataPath = resolve(__dirname, "cache", "data.json");
      const data = require(dataPath);

      data.adminbox[threadID] = !data.adminbox[threadID];
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));

      return api.sendMessage(
        SECURITY_BOX(
          data.adminbox[threadID]
            ? "QTV Only Mode ENABLED 🔥"
            : "QTV Only Mode DISABLED ❄️"
        ),
        threadID,
        messageID
      );
    }

    default:
      return api.sendMessage(
        BOT_BOX("Invalid Admin Command ❌"),
        threadID,
        messageID
      );
  }
};