const fs = require("fs-extra");

/* ================= FILE PATH ================= */

const pathFile = __dirname + "/cache/autoseen.txt";
if (!fs.existsSync(pathFile)) fs.writeFileSync(pathFile, "false");

/* ================= STYLE BOX ================= */

const box = (title, body) =>
`╭─── ${title} ───╮

${body}

╰─────────────────╯`;

/* ================= CONFIG ================= */

module.exports.config = {
    name: "autoseen",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "SaGor",
    description: "Auto seen all messages",
    commandCategory: "Tools",
    usages: "autoseen on/off",
    cooldowns: 5
};

/* ================= HANDLE EVENT ================= */

module.exports.handleEvent = async ({ api }) => {
    const status = fs.readFileSync(pathFile, "utf-8");
    if (status === "true") {
        api.markAsReadAll(() => {});
    }
};

/* ================= COMMAND RUN ================= */

module.exports.run = async ({ api, event, args }) => {
    try {
        if (args[0] === "on") {
            fs.writeFileSync(pathFile, "true");
            return api.sendMessage(
                box(
                    "👀 AUTO SEEN",
                    `✅ Auto Seen is now ENABLED`
                ),
                event.threadID,
                event.messageID
            );
        }

        if (args[0] === "off") {
            fs.writeFileSync(pathFile, "false");
            return api.sendMessage(
                box(
                    "👀 AUTO SEEN",
                    `❌ Auto Seen is now DISABLED`
                ),
                event.threadID,
                event.messageID
            );
        }

        return api.sendMessage(
            box(
                "⚠️ WRONG FORMAT",
                `Use:\n${global.config.PREFIX}autoseen on\n${global.config.PREFIX}autoseen off`
            ),
            event.threadID,
            event.messageID
        );

    } catch (e) {
        console.log(e);
    }
};
