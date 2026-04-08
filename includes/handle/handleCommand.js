module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const stringSimilarity = require('string-similarity');
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const logger = require("../../utils/log.js");
  const axios = require('axios');
  const moment = require("moment-timezone");

  return async function ({ event }) {
    const dateNow = Date.now();
    const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");
    const { allowInbox, PREFIX, ADMINBOT, NDH, DeveloperMode, adminOnly, keyAdminOnly, ndhOnly, adminPaOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, cooldowns } = global.client;

    let { body, senderID, threadID, messageID } = event;
    senderID = String(senderID);
    threadID = String(threadID);

    const threadSetting = threadData.get(threadID) || {};
    const prefixRegex = new RegExp(`^(<@!?${senderID}>|${escapeRegex((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : PREFIX)})\\s*`);

    if (!prefixRegex.test(body)) return;

    const adminbot = require('./../../config.json');

    // Admin PA Only Check
    if (!global.data.allThreadID.includes(threadID) && !ADMINBOT.includes(senderID) && adminbot.adminPaOnly === true) {
      return api.sendMessage("❌ MODE » Only admins can use bots in their own inbox", threadID, messageID);
    }

    // Admin Only Check
    if (!ADMINBOT.includes(senderID) && adminbot.adminOnly === true) {
      return api.sendMessage('❌ MODE » Only admins can use bots', threadID, messageID);
    }

    // NDH Only Check
    if (!NDH.includes(senderID) && !ADMINBOT.includes(senderID) && adminbot.ndhOnly === true) {
      return api.sendMessage('❌ MODE » Only bot support can use bots', threadID, messageID);
    }

    // Admin Box Check
    const dataAdbox = require('../../script/commands/cache/data.json');
    const threadInf = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
    const findAdmin = threadInf.adminIDs.find(el => el.id == senderID);

    if (dataAdbox.adminbox?.hasOwnProperty(threadID) && dataAdbox.adminbox[threadID] === true && !ADMINBOT.includes(senderID) && !findAdmin && event.isGroup === true) {
      return api.sendMessage('❌ MODE » Only admins can use bots in this group', event.threadID, event.messageID);
    }

    // User/Thread Ban Check
    if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox === false && senderID === threadID)) {
      if (!ADMINBOT.includes(senderID.toString())) {
        if (userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(
            global.getText("handleCommand", "userBanned", reason, dateAdded), 
            threadID, 
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, 
            messageID
          );
        } else if (threadBanned.has(threadID)) {
          const { reason, dateAdded } = threadBanned.get(threadID) || {};
          return api.sendMessage(
            global.getText("handleCommand", "threadBanned", reason, dateAdded), 
            threadID, 
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, 
            messageID
          );
        }
      }
    }

    // Parse Command
    const [matchedPrefix] = body.match(prefixRegex);
    const args = body.slice(matchedPrefix.length).trim().split(/ +/);
    let commandName = args.shift()?.toLowerCase();

    // If only prefix is sent
    if (!commandName) {
      return api.sendMessage(global.getText("handleCommand", "onlyprefix"), threadID);
    }

    // Find Command
    let command = commands.get(commandName);
    if (!command) {
      const allCommandName = Array.from(commands.keys());
      const checker = stringSimilarity.findBestMatch(commandName, allCommandName);

      if (checker.bestMatch.rating >= 0.5) {
        command = commands.get(checker.bestMatch.target);
      } else {
        return api.sendMessage(
          global.getText("handleCommand", "commandNotExist", checker.bestMatch.target), 
          threadID
        );
      }
    }

    // Command Ban Check
    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [];
        const banUsers = commandBanned.get(senderID) || [];

        if (banThreads.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandThreadBanned", command.config.name), 
            threadID, 
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, 
            messageID
          );
        }

        if (banUsers.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandUserBanned", command.config.name), 
            threadID, 
            async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, 
            messageID
          );
        }
      }
    }

    // NSFW Check
    if (command.config.commandCategory?.toLowerCase() === 'nsfw' && 
        !global.data.threadAllowNSFW?.includes(threadID) && 
        !ADMINBOT.includes(senderID)) {
      return api.sendMessage(
        global.getText("handleCommand", "threadNotAllowNSFW"), 
        threadID, 
        async (err, info) => {
          await new Promise(resolve => setTimeout(resolve, 5 * 1000));
          return api.unsendMessage(info.messageID);
        }, 
        messageID
      );
    }

    // Get Thread Info for Group
    let threadInfo2;
    if (event.isGroup === true) {
      try {
        threadInfo2 = threadInfo.get(threadID) || await Threads.getInfo(threadID);
        if (Object.keys(threadInfo2).length === 0) throw new Error();
      } catch (err) {
        logger(global.getText("handleCommand", "cantGetInfoThread", "error"));
      }
    }

    // Permission Check
    let permssion = 0;
    const threadInfoo = threadInfo.get(threadID) || await Threads.getInfo(threadID);
    const find = threadInfoo.adminIDs?.find(el => el.id == senderID);

    if (NDH.includes(senderID.toString())) permssion = 2;
    if (ADMINBOT.includes(senderID.toString())) permssion = 3;
    else if (!ADMINBOT.includes(senderID) && !NDH.includes(senderID) && find) permssion = 1;

    if (command.config.hasPermssion > permssion) {
      return api.sendMessage(
        global.getText("handleCommand", "permissionNotEnough", command.config.name), 
        event.threadID, 
        event.messageID
      );
    }

    // Cooldown Check
    if (!cooldowns.has(command.config.name)) {
      cooldowns.set(command.config.name, new Map());
    }

    const timestamps = cooldowns.get(command.config.name);
    const expirationTime = (command.config.cooldowns || 1) * 1000;

    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      const timeLeft = ((timestamps.get(senderID) + expirationTime - dateNow) / 1000).toFixed(2);
      return api.sendMessage(
        `⏱️ Please wait ${timeLeft} seconds before using this command again!`, 
        threadID, 
        messageID
      );
    }

    // Language Support
    let getText2;
    if (command.languages && typeof command.languages === 'object' && command.languages.hasOwnProperty(global.config.language)) {
      getText2 = (...values) => {
        let lang = command.languages[global.config.language][values[0]] || '';
        for (let i = values.length; i > 0; i--) {
          const expReg = RegExp('%' + i, 'g');
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    } else {
      getText2 = () => {};
    }

    // Execute Command
    try {
      const commandContext = {
        api,
        event,
        args,
        models,
        Users,
        Threads,
        Currencies,
        permssion,
        getText: getText2
      };

      await command.run(commandContext);
      timestamps.set(senderID, dateNow);

      if (DeveloperMode === true) {
        const executionTime = Date.now() - dateNow;
        logger(
          global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), executionTime),
          "[ DEV MODE ]"
        );
      }

    } catch (error) {
      console.error("Command execution error:", error);
      return api.sendMessage(
        global.getText("handleCommand", "commandError", commandName, error.message || error), 
        threadID
      );
    }
  };
};