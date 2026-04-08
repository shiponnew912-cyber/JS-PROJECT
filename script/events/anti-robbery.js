module.exports.config = {
    name: "antirobbery",
    eventType: ["log:thread-admins"],
    version: "1.0.0",
    credits: "SaGor",
    description: "create by SaGor"
};

module.exports.run = async function ({ event, api, Threads, Users }) {
    const { logMessageType, logMessageData } = event;
    let data = (await Threads.getData(event.threadID)).data || {};

    if (data.guard == false) return;

    if (data.guard == true) {
        switch (logMessageType) {
            case "log:thread-admins": {

                // ADMIN ADD
                if (logMessageData.ADMIN_EVENT == "add_admin") {
                    if (event.author == api.getCurrentUserID()) return;
                    if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;

                    api.changeAdminStatus(
                        event.threadID,
                        event.author,
                        false,
                        editAdminsCallback
                    );
                    api.changeAdminStatus(
                        event.threadID,
                        logMessageData.TARGET_ID,
                        false
                    );

                    function editAdminsCallback(err) {
                        if (err)
                            return api.sendMessage(
                                "😛 Oops boss, a little error occurred.",
                                event.threadID,
                                event.messageID
                            );

                        return api.sendMessage(
                            "🛡️ Anti-Robbery is active boss 😐✌️\nAdmin permission is not allowed",
                            event.threadID,
                            event.messageID
                        );
                    }
                }

                // ADMIN REMOVE
                else if (logMessageData.ADMIN_EVENT == "remove_admin") {
                    if (event.author == api.getCurrentUserID()) return;
                    if (logMessageData.TARGET_ID == api.getCurrentUserID()) return;

                    api.changeAdminStatus(
                        event.threadID,
                        event.author,
                        false,
                        editAdminsCallback
                    );
                    api.changeAdminStatus(
                        event.threadID,
                        logMessageData.TARGET_ID,
                        true
                    );

                    function editAdminsCallback(err) {
                        if (err)
                            return api.sendMessage(
                                "😛 Oops boss, a little error occurred.",
                                event.threadID,
                                event.messageID
                            );

                        return api.sendMessage(
                            "🛡️ Anti-Robbery is active boss 😐✌️\nAdmin removal is not allowed",
                            event.threadID,
                            event.messageID
                        );
                    }
                }
            }
        }
    }
};
