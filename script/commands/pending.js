// ================= CREATOR LOCK =================
const CREATOR_LOCK = (() => {
  const encoded = "U2FHb3I="; 
  return Buffer.from(encoded, "base64").toString("utf8");
})();

module.exports.config = {
    name: "pending",
    version: "2.1.0",
    credits: "SaGor",
    hasPermssion: 2,
    description: "Pending Group Approval System (Hinglish)",
    commandCategory: "SYSTEM",
    cooldowns: 5
};

// 🔐 Credit Protection
if (module.exports.config.credits !== CREATOR_LOCK) {
    console.log("❌ Creator Lock Activated! Credits cannot be changed.");
    module.exports.run = () => {};
    module.exports.handleReply = () => {};
    return;
}

module.exports.languages = {
    en: {
        invaildNumber: "❌ Boss this number is wrong 👉 %1\nDhyan send the correct number 😐",

        cancelSuccess: "✅ Boss %1 group has been removed from pending 🚫",

        approveSuccess: "🎉 Boss, you have approved the %1 group. 🤝",

        notiBox:
            "✅ Your group has been approved 🎉\n" +
            "📌 To see the commands 👉 #help | #help2",
      
        returnListPending:
            "╭──────── ★ ·.· ────────╮\n" +
            "        🔔 PENDING GROUPS\n" +
            "╰──────── ·.· ★ ────────╯\n\n" +
            "👑 Boss, you have a total of %1 groups pending\n\n" +
"%2\n" +
            "✏️ Send number to approve\n" +
            "🚫 To remove, write: c 1 2 3",

        returnListClean:
            "╭──────── ★ ·.· ────────╮\n" +
            "        🔔 PENDING GROUPS\n" +
            "╰──────── ·.· ★ ────────╯\n\n" +
            "😎 Boss, there is no group pending right now."
    }
};

// ===================================================

module.exports.handleReply = async function ({ api, event, handleReply, getText }) {
    if (String(event.senderID) !== String(handleReply.author)) return;

    const { body, threadID, messageID } = event;
    let count = 0;

    if (!body) return;

    // CANCEL MODE
    if (body.toLowerCase().startsWith("c")) {
        const indexList = body.slice(1).trim().split(/\s+/);

        for (const i of indexList) {
            if (isNaN(i) || i <= 0 || i > handleReply.pending.length)
                return api.sendMessage(
                    getText("invaildNumber", i),
                    threadID,
                    messageID
                );

            await api.removeUserFromGroup(
                api.getCurrentUserID(),
                handleReply.pending[i - 1].threadID
            );
            count++;
        }

        return api.sendMessage(
            getText("cancelSuccess", count),
            threadID,
            messageID
        );
    }

    // APPROVE MODE
    const indexList = body.trim().split(/\s+/);

    for (const i of indexList) {
        if (isNaN(i) || i <= 0 || i > handleReply.pending.length)
            return api.sendMessage(
                getText("invaildNumber", i),
                threadID,
                messageID
            );

        await api.sendMessage(
            getText("notiBox"),
            handleReply.pending[i - 1].threadID
        );
        count++;
    }

    return api.sendMessage(
        getText("approveSuccess", count),
        threadID,
        messageID
    );
};

// ===================================================

module.exports.run = async function ({ api, event, getText }) {
    const { threadID, messageID, senderID } = event;
    let msg = "";
    let index = 1;

    let list = [];
    try {
        const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
        const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
        list = [...spam, ...pending].filter(t => t.isGroup && t.isSubscribed);
    } catch (e) {
        return api.sendMessage(
            "❌ An error occurred loading the Boss pending list.",
            threadID,
            messageID
        );
    }

    for (const group of list) {
        msg +=
            `🔹 ${index++}. ${group.name}\n` +
            `🆔 ${group.threadID}\n` +
            `༺══──────────══༻\n`;
    }

    if (list.length === 0)
        return api.sendMessage(
            getText("returnListClean"),
            threadID,
            messageID
        );

    return api.sendMessage(
        getText("returnListPending", list.length, msg),
        threadID,
        (err, info) => {
            global.client.handleReply.push({
                name: module.exports.config.name,
                messageID: info.messageID,
                author: senderID,
                pending: list
            });
        },
        messageID
    );
};
