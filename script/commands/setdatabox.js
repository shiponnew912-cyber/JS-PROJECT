module.exports.config = {
    name: "setdatabox",
    version: "1.0",
    hasPermssion: 2,
    credits: "D-Jukie",
    description: "Set the new data for the boxes into the data.",
    commandCategory: "System",
    usages: "",
    cooldowns: 5,
    
};
module.exports.run = async function ({ event, args, api, Threads }) { 
const { threadID } = event;
const { setData, getData } = Threads;
var inbox = await api.getThreadList(100, null, ['INBOX']);
  let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
  const lengthGroup = list.length
  for (var groupInfo of list) {
    console.log(`The box ID data has been updated.: ${groupInfo.threadID}`)
    var threadInfo = await api.getThreadInfo(groupInfo.threadID);
    threadInfo.threadName;
    await Threads.setData(groupInfo.threadID, { threadInfo });
  }
    console.log(`The data for the ${lengthGroup} box has been updated.`)
    return api.sendMessage(`The data for the ${lengthGroup} box has been updated.`, threadID)
}