module.exports.config = {
  name: "antiname",
  eventType: ["log:user-nickname"],
  version: "0.0.1",
  credits: "SaGor",
  description: "This bot has been created by SaGor"
};

module.exports.run = async function({ api, event, Users, Threads }) {
    var { logMessageData, threadID, author } = event;
    var botID = api.getCurrentUserID();
    var { BOTNAME, ADMINBOT } = global.config;

    var { nickname } = await Threads.getData(threadID, botID);
    nickname = nickname ? nickname : BOTNAME;

    if (
        logMessageData.participant_id == botID &&
        author != botID &&
        !ADMINBOT.includes(author) &&
        logMessageData.nickname != nickname
    ) {
        api.changeNickname(nickname, threadID, botID);

        return api.sendMessage(
            { body: "😎 Sorry boss, you can't change my name. ✌️" },
            threadID
        );
    }
};
