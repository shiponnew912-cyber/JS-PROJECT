module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return async function ({ event }) {
        // Skip if not a reply to a message
        if (!event.messageReply) return;

        const { handleReply, commands } = global.client;
        const { messageID, threadID, messageReply, senderID, body } = event;

        // No replies being handled
        if (!handleReply || handleReply.length === 0) return;

        try {
            // Find the reply handler for the original message
            const replyIndex = handleReply.findIndex(e => e.messageID == messageReply.messageID);

            // No handler found
            if (replyIndex < 0) return;

            // Get the reply data
            const replyData = handleReply[replyIndex];

            // Validate reply data
            if (!replyData || !replyData.name) {
                // Clean up invalid handler
                handleReply.splice(replyIndex, 1);
                return api.sendMessage(
                    global.getText('handleReply', 'invalidData'), 
                    threadID, 
                    messageID
                );
            }

            // Check if the reply is from the correct user (if specified)
            if (replyData.authorOnly === true && replyData.author !== senderID) {
                return api.sendMessage(
                    global.getText('handleReply', 'notAuthor', replyData.name), 
                    threadID, 
                    messageID
                );
            }

            // Find the command that handles this reply
            const commandModule = commands.get(replyData.name);

            // Command not found
            if (!commandModule) {
                // Clean up invalid handler
                handleReply.splice(replyIndex, 1);
                return api.sendMessage(
                    global.getText('handleReply', 'commandNotFound', replyData.name), 
                    threadID, 
                    messageID
                );
            }

            // Check if command has handleReply function
            if (typeof commandModule.handleReply !== 'function') {
                // Clean up if command doesn't handle replies anymore
                handleReply.splice(replyIndex, 1);
                return;
            }

            // Create language helper
            const getText = createReplyTextHelper(commandModule, replyData.name, api, threadID, messageID);

            // Prepare execution context
            const replyContext = {
                api,
                event,
                models,
                Users,
                Threads,
                Currencies,
                handleReply: replyData,
                getText,

                // Additional useful data
                replyMessage: messageReply,
                replySender: senderID,
                replyBody: body,

                // Helper methods
                removeHandler: () => {
                    const idx = handleReply.findIndex(e => e.messageID == messageReply.messageID);
                    if (idx >= 0) handleReply.splice(idx, 1);
                },

                updateHandler: (newData) => {
                    const idx = handleReply.findIndex(e => e.messageID == messageReply.messageID);
                    if (idx >= 0) {
                        handleReply[idx] = { ...handleReply[idx], ...newData };
                    }
                }
            };

            // Execute the reply handler
            await commandModule.handleReply(replyContext);

            // Auto-cleanup after execution if specified
            if (replyData.oneTime === true) {
                const idx = handleReply.findIndex(e => e.messageID == messageReply.messageID);
                if (idx >= 0) handleReply.splice(idx, 1);
            }

        } catch (error) {
            console.error("Reply handler error:", error);
            return api.sendMessage(
                global.getText('handleReply', 'executeError', error.message || error), 
                threadID, 
                messageID
            );
        }
    };
};

// Helper function for text translation in replies
function createReplyTextHelper(commandModule, commandName, api, threadID, messageID) {
    return (...values) => {
        try {
            // Check if command has languages support
            if (!commandModule.languages || typeof commandModule.languages !== 'object') {
                return values[0] || '';
            }

            const langCode = global.config.language;

            // Check if language exists
            if (!commandModule.languages.hasOwnProperty(langCode)) {
                api.sendMessage(
                    global.getText('handleCommand', 'notFoundLanguage', commandName), 
                    threadID, 
                    messageID
                );
                return values[0] || '';
            }

            // Get the text for the key
            let text = commandModule.languages[langCode][values[0]] || values[0] || '';

            // Replace placeholders like %1, %2, etc.
            for (let i = 1; i < values.length; i++) {
                if (values[i] !== undefined) {
                    text = text.replace(new RegExp('%' + i, 'g'), values[i]);
                }
            }

            return text;

        } catch (error) {
            console.error("Reply text helper error:", error);
            return values[0] || '';
        }
    };
}