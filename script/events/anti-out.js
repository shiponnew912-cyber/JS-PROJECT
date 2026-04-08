module.exports.config = {
  name: "antiout",
  eventType: ["log:unsubscribe"],
  version: "0.0.1",
  credits: "SaGor",
  description: "create by SaGor"
};

module.exports.run = async ({ event, api, Threads, Users }) => {
  let data = (await Threads.getData(event.threadID)).data || {};
  if (data.antiout == false) return;

  if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

  const userID = event.logMessageData.leftParticipantFbId;
  const name =
    global.data.userName.get(userID) ||
    await Users.getNameUser(userID);

  const type =
    (event.author == userID)
      ? "self-separation"
      : "kick";

  if (type == "self-separation") {
    api.addUserToGroup(userID, event.threadID, (error, info) => {
      if (error) {
        api.sendMessage(
          `😏 Hey ${name} boss, running away is not that easy 😄`,
          event.threadID
        );
      } else {
        api.sendMessage(
          `🥱 ${name} The boss is back, the exit is ON 😎`,
          event.threadID
        );
      }
    });
  }
};
