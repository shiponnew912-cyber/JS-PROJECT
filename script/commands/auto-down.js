const fs = require("fs");
const { downloadVideo } = require("sagor-video-downloader");

module.exports.config = {
    name: "autodown",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "SAGOR",
    description: "Auto download & send video from links",
    commandCategory: "media",
    usages: "",
    cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {

    const { threadID, messageID, body } = event;
    if (!body) return;

    const linkMatches = body.match(/(https?:\/\/[^\s]+)/g);
    if (!linkMatches) return;

    const uniqueLinks = [...new Set(linkMatches)];

    // loading reaction
    api.setMessageReaction("⏳", messageID, () => {}, true);

    let successCount = 0;
    let failCount = 0;

    for (const url of uniqueLinks) {
        try {

            const { title, filePath } = await downloadVideo(url);

            if (!filePath || !fs.existsSync(filePath)) throw new Error();

            const stats = fs.statSync(filePath);
            const fileSizeInMB = stats.size / (1024 * 1024);

            // limit 25MB
            if (fileSizeInMB > 25) {
                fs.unlinkSync(filePath);
                failCount++;
                continue;
            }

            await api.sendMessage(
                {
                    body:
`📥 𝗩𝗜𝗗𝗘𝗢 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗
━━━━━━━━━━━━━━━
🎬 Title: ${title || "Video"}
📦 Size: ${fileSizeInMB.toFixed(2)} MB
━━━━━━━━━━━━━━━`,
                    attachment: fs.createReadStream(filePath)
                },
                threadID
            );

            fs.unlinkSync(filePath);
            successCount++;

        } catch (e) {
            failCount++;
        }
    }

    const finalReaction =
        successCount > 0 && failCount === 0 ? "✅" :
        successCount > 0 ? "⚠️" : "❌";

    api.setMessageReaction(finalReaction, messageID, () => {}, true);
};

module.exports.run = async function () {};
