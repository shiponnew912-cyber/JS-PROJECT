module.exports.config = {
	name: "help",
	version: "2.2.0",
	hasPermssion: 0,
	credits: "SaGor",
	description: "Category help menu",
	commandCategory: "system",
	cooldowns: 5,
	aliases: ["menu"]
};

module.exports.run = async function({ api, event, args }) {
	try {
		const commands = global.client.commands;

		if (!args[0]) {
			const categories = {};

			for (const [name, cmd] of commands) {
				const category = cmd.config.commandCategory || "other";

				if (!categories[category]) categories[category] = [];
				categories[category].push(name);
			}

			let msg = "";

			for (const category in categories) {
				msg += `╭─────『 ${category.toUpperCase()} 』\n`;

				for (const cmd of categories[category]) {
					msg += `│ ▸ ${cmd}\n`;
				}

				msg += `╰──────────────\n\n`;
			}

			return api.sendMessage(msg.trim(), event.threadID, event.messageID);
		}

		const cmdName = args[0].toLowerCase();
		const command = commands.get(cmdName);

		if (!command)
			return api.sendMessage("❌ Command not found", event.threadID, event.messageID);

		const config = command.config;

		const msg =
`╭─────『 COMMAND DETAILS 』
│ ▸ Name: ${config.name}
│ ▸ Author: ${config.credits || "Unknown"}
│ ▸ Category: ${config.commandCategory}
│ ▸ Description: ${config.description || "No description"}
│ ▸ Usage: ${config.usages || "No usage"}
│ ▸ Permission: ${config.hasPermssion == 0 ? "User" : config.hasPermssion == 1 ? "Admin" : "Bot Admin"}
╰──────────────`;

		return api.sendMessage(msg, event.threadID, event.messageID);

	} catch {
		return api.sendMessage("Error", event.threadID, event.messageID);
	}
};
