module.exports = function ({ Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return async function ({ event }) {
        const { allUserID, allCurrenciesID, allThreadID, userName, threadInfo } = global.data;
        const { autoCreateDB } = global.config;

        // Exit if auto-create is disabled
        if (autoCreateDB !== true) return;

        const { senderID, threadID } = event;
        const senderIdStr = String(senderID);
        const threadIdStr = String(threadID);

        try {
            // Thread creation
            if (!allThreadID.includes(threadIdStr) && event.isGroup === true) {
                await handleThreadCreation(threadIdStr);
            }

            // User creation
            if (!allUserID.includes(senderIdStr) || !userName.has(senderIdStr)) {
                await handleUserCreation(senderIdStr);
            }

            // Currency creation
            if (!allCurrenciesID.includes(senderIdStr)) {
                await handleCurrencyCreation(senderIdStr);
            }

        } catch (error) {
            logger(`Database Error: ${error.message}`, "error");
        }

        // ============= HELPER FUNCTIONS =============

        async function handleThreadCreation(threadId) {
            const threadInfoData = await Threads.getInfo(threadId);

            const threadData = {
                threadName: threadInfoData.threadName || "Unnamed Group",
                adminIDs: threadInfoData.adminIDs || [],
                nicknames: threadInfoData.nicknames || {}
            };

            // Save thread
            allThreadID.push(threadId);
            threadInfo.set(threadId, threadData);
            await Threads.setData(threadId, { threadInfo: threadData, data: {} });

            // Save all members
            if (threadInfoData.userInfo?.length) {
                for (const user of threadInfoData.userInfo) {
                    const uid = String(user.id);
                    if (!allUserID.includes(uid)) {
                        await Users.createData(uid, { name: user.name, data: {} });
                        allUserID.push(uid);
                        userName.set(uid, user.name);
                        logger(`👤 New user: ${uid}`, '[ DATABASE ]');
                    }
                }
            }

            logger(`📱 New thread: ${threadId}`, '[ DATABASE ]');
        }

        async function handleUserCreation(userId) {
            const userInfo = await Users.getInfo(userId);

            if (userInfo?.name) {
                await Users.createData(userId, { name: userInfo.name, data: {} });
                allUserID.push(userId);
                userName.set(userId, userInfo.name);
                logger(`👤 New user: ${userId} (${userInfo.name})`, '[ DATABASE ]');
            }
        }

        async function handleCurrencyCreation(userId) {
            await Currencies.createData(userId, { 
                data: { money: 0, exp: 0, level: 1 } 
            });
            allCurrenciesID.push(userId);
            logger(`💰 New currency: ${userId}`, '[ DATABASE ]');
        }
    };
};