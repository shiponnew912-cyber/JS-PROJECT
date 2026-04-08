// ================= CREATOR LOCK =================
const CREATOR_LOCK = (() => {
  const encoded = "U2FHb3I=";
  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
  name: "kick",
  version: "3.0.0",
  hasPermssion: 1,
  credits: "SaGor", 
  description: "Group se member ya sab members ko remove kare",
  commandCategory: "Group",
  usages: "@user / all",
  cooldowns: 5
};

// 🔐 HARD CREDIT PROTECTION
if (!module.exports.config.credits || module.exports.config.credits !== CREATOR_LOCK) {
  console.log("❌ CREATOR LOCK ACTIVATED! Credits modified.");

  module.exports.run = async function ({ api, event }) {
    return api.sendMessage(
      "❌ This command is locked by creator.\nCredits cannot be modified.",
      event.threadID,
      event.messageID
    );
  };

  module.exports.handleEvent = () => {};
  return;
}

// ================= MAIN COMMAND =================
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);

    // 🔒 Group check
    if (!threadInfo.isGroup) {
      return api.sendMessage("❌ This command will run only in the group.", threadID, messageID);
    }

    // 🔒 Admin check
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id == senderID);
    if (!isAdmin) {
      return api.sendMessage("❌ Only the group admin can use this command.", threadID, messageID);
    }

    const botID = api.getCurrentUserID();

    // ================= KICK ALL =================
    if (args[0] && args[0].toLowerCase() === "all") {

      const membersToKick = threadInfo.participantIDs.filter(uid => {
        const isAdminMember = threadInfo.adminIDs.some(admin => admin.id == uid);
        return uid != botID && !isAdminMember;
      });

      if (membersToKick.length === 0) {
        return api.sendMessage("❌ Couldn't find any non-admin members to kick.", threadID);
      }

      api.sendMessage("⚠️ All non-admin members are being removed....", threadID);

      for (const uid of membersToKick) {
        api.removeUserFromGroup(uid, threadID);
      }

      return api.sendMessage(
        `✅ Successfully ${membersToKick.length} The members were removed.`,
        threadID
      );
    }

    // ================= SINGLE USER KICK =================
    if (Object.keys(mentions).length === 0) {
      return api.sendMessage(
        "❌ Mention the one you want to kick..\n\nExample:\n.kick @user\n.kick all",
        threadID,
        messageID
      );
    }

    const userIDToKick = Object.keys(mentions)[0];
    const userName = mentions[userIDToKick].replace("@", "");

    // 🤖 Bot protection
    if (userIDToKick == botID) {
      return api.sendMessage("❌ I can't remove myself.", threadID, messageID);
    }

    // 🔒 Target admin protection
    const isTargetAdmin = threadInfo.adminIDs.some(admin => admin.id == userIDToKick);
    if (isTargetAdmin) {
      return api.sendMessage("❌ The admin cannot be removed.", threadID, messageID);
    }

    api.sendMessage(`⏳ ${userName} is being removed...`, threadID);

    api.removeUserFromGroup(userIDToKick, threadID, (err) => {
      if (err) {
        return api.sendMessage(
          "❌ User cannot be removed.\nCheck:\n- Is the bot admin or not\n- Is the user in the group or not",
          threadID
        );
      }

      return api.sendMessage(`✅ Successfully ${userName} has been removed.`, threadID);
    });

  } catch (error) {
    console.log("Kick Command Error:", error);
    return api.sendMessage(
      "❌ Command execute karte waqt error aa gaya.",
      threadID,
      messageID
    );
  }
};
