module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return async function ({ event }) {
        const { allowInbox } = global.config;
        const { userBanned, threadBanned } = global.data;
        const { commands, eventRegistered } = global.client;

        let { senderID, threadID, messageID } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        // Check if user or thread is banned
        if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox === false && senderID === threadID)) {
            return;
        }

        // Process all registered events
        for (const eventReg of eventRegistered) {
            const cmd = commands.get(eventReg);

            if (!cmd) {
                logger(`Command ${eventReg} not found in registered events`, 'warn');
                continue;
            }

            // Check if command has handleEvent function
            if (typeof cmd.handleEvent !== 'function') {
                continue;
            }

            // Setup language support
            let getText2 = () => {};

            if (cmd.languages && typeof cmd.languages === 'object') {
                getText2 = (...values) => {
                    try {
                        const commandModule = cmd.languages || {};

                        // Check if language exists
                        if (!commandModule.hasOwnProperty(global.config.language)) {
                            const errorMsg = global.getText('handleCommand', 'notFoundLanguage', cmd.config?.name || eventReg);
                            api.sendMessage(errorMsg, threadID, messageID);
                            return '';
                        }

                        let lang = cmd.languages[global.config.language][values[0]] || '';

                        // Replace placeholders like %1, %2, etc.
                        for (let i = values.length - 1; i >= 0; i--) {
                            const expReg = new RegExp('%' + (i + 1), 'g');
                            lang = lang.replace(expReg, values[i + 1]);
                        }

                        return lang;
                    } catch (error) {
                        logger(`Error in getText for command ${cmd.config?.name || eventReg}: ${error.message}`, 'error');
                        return '';
                    }
                };
            }

            // Prepare command context
            try {
                const commandContext = {
                    event: event,
                    api: api,
                    models: models,
                    Users: Users,
                    Threads: Threads,
                    Currencies: Currencies,
                    getText: getText2
                };

                // Execute the handleEvent function
                await cmd.handleEvent(commandContext);

            } catch (error) {
                // Log error but continue processing other events
                logger(
                    global.getText('handleCommandEvent', 'moduleError', cmd.config?.name || eventReg, error.message),
                    'error'
                );

                // Optional: Send error message in development mode
                if (global.config.DeveloperMode === true) {
                    api.sendMessage(
                        `⚠️ Error in event ${cmd.config?.name || eventReg}:\n${error.message}`,
                        threadID,
                        messageID
                    );
                }
            }
        }
    };
};