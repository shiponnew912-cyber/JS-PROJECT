module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return async function ({ event }) {
        const { handleReaction, commands } = global.client;
        const { messageID, threadID, reaction, userID } = event;

        // No reactions to process
        if (!handleReaction?.length) return;

        try {
            // Find reaction handler
            const handlerIndex = handleReaction.findIndex(e => e.messageID == messageID);
            if (handlerIndex < 0) return;

            const reactionData = handleReaction[handlerIndex];
            if (!reactionData?.name) {
                handleReaction.splice(handlerIndex, 1);
                return;
            }

            // Find command module
            const cmd = commands.get(reactionData.name);
            if (!cmd || typeof cmd.handleReaction !== 'function') {
                handleReaction.splice(handlerIndex, 1);
                return;
            }

            // Language helper
            const getText = (...args) => {
                try {
                    if (!cmd.languages?.[global.config.language]) return args[0] || '';
                    let text = cmd.languages[global.config.language][args[0]] || args[0] || '';
                    for (let i = 1; i < args.length; i++) {
                        text = text.replace(new RegExp('%' + i, 'g'), args[i]);
                    }
                    return text;
                } catch {
                    return args[0] || '';
                }
            };

            // Execute handler
            await cmd.handleReaction({
                api, event, models, Users, Threads, Currencies,
                handleReaction: reactionData,
                reaction, userID,
                getText,
                removeHandler: () => {
                    const idx = handleReaction.findIndex(e => e.messageID == messageID);
                    if (idx >= 0) handleReaction.splice(idx, 1);
                }
            });

            // Auto cleanup if needed
            if (reactionData.oneTime) {
                const idx = handleReaction.findIndex(e => e.messageID == messageID);
                if (idx >= 0) handleReaction.splice(idx, 1);
            }

        } catch (error) {
            api.sendMessage(
                global.getText('handleReaction', 'executeError', error.message), 
                threadID, 
                messageID
            );
        }
    };
};