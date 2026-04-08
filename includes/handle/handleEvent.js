module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const moment = require("moment-timezone");

    return async function ({ event }) {
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox, DeveloperMode } = global.config;

        // Basic checks
        const senderID = String(event.senderID);
        const threadID = String(event.threadID);

        if (userBanned.has(senderID) || threadBanned.has(threadID) || 
            (allowInbox === false && senderID === threadID)) {
            return;
        }

        // Normalize event type
        const logType = event.type === "change_thread_image" 
            ? "change_thread_image" 
            : event.logMessageType;

        if (!logType) return;

        const timeStart = Date.now();
        const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");

        // Process events
        const eventPromises = [];

        for (const [name, module] of events) {
            // Check if module matches this event type
            const eventTypes = module.config?.eventType;
            if (!eventTypes) continue;

            const matches = Array.isArray(eventTypes) 
                ? eventTypes.includes(logType) 
                : eventTypes === logType;

            if (!matches) continue;

            if (typeof module.run !== 'function') {
                logger(`Event ${name} missing run function`, 'warn');
                continue;
            }

            // Create execution promise
            eventPromises.push(
                (async () => {
                    try {
                        await module.run({ api, event, models, Users, Threads, Currencies });

                        if (DeveloperMode) {
                            logger(
                                `[EVENT] ${time} | ${module.config.name} | ${threadID} | ${Date.now() - timeStart}ms`,
                                '[ EVENT ]'
                            );
                        }
                    } catch (err) {
                        logger(`Event error ${name}: ${err.message}`, 'error');

                        if (DeveloperMode) {
                            api.sendMessage(
                                `❌ Event ${name} error:\n${err.message}`,
                                threadID,
                                event.messageID
                            ).catch(console.error);
                        }
                    }
                })()
            );
        }

        // Run all events
        if (eventPromises.length) {
            await Promise.allSettled(eventPromises);
        }
    };
};