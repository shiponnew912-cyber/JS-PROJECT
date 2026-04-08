module.exports.config = {
  name: "setall",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "SaGor",
  description: "Set nicknames all tv",
  commandCategory: "other",
  usages: "setall [name]",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const threadInfo = await api.getThreadInfo(event.threadID);
  const idtv = threadInfo.participantIDs;

  const name = args.join(" ");

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  for (let setname of idtv) {
    await delay(3000);
    api.changeNickname(name, event.threadID, setname);
  }
};
