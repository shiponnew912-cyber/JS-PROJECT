/* ================= CONFIG ================= */

module.exports.config = {
	name: "thread",
	version: "1.1.0",
	hasPermssion: 2,
	credits: "SaGor",
	description: "Ban / Unban / Search Group (System Control)",
	commandCategory: "system",
	usages: "thread ban <tid> | thread unban <tid> | thread search <name>",
	cooldowns: 5
};

/* ================= UI BOX ================= */

const box = (title, body) =>
`╭───〔 ${title} 〕───╮

${body}

╰────────────────────╯`;

/* ================= HANDLE REACTION ================= */

module.exports.handleReaction = async ({ event, api, Threads, handleReaction }) => {
	if (parseInt(event.userID) !== parseInt(handleReaction.author)) return;

	const threadID = handleReaction.target;
	const dataThread = (await Threads.getData(threadID)).data || {};

	if (handleReaction.type === "ban") {
		dataThread.banned = 1;
		await Threads.setData(threadID, { data: dataThread });
		global.data.threadBanned.set(parseInt(threadID), 1);

		return api.sendMessage(
			box("🚫 THREAD BANNED", `Thread ID : ${threadID}\nStatus   : Successfully Banned`),
			event.threadID,
			() => api.unsendMessage(handleReaction.messageID)
		);
	}

	if (handleReaction.type === "unban") {
		dataThread.banned = 0;
		await Threads.setData(threadID, { data: dataThread });
		global.data.threadBanned.delete(parseInt(threadID));

		return api.sendMessage(
			box("✅ THREAD UNBANNED", `Thread ID : ${threadID}\nStatus   : Successfully Unbanned`),
			event.threadID,
			() => api.unsendMessage(handleReaction.messageID)
		);
	}
};

/* ================= MAIN RUN ================= */

module.exports.run = async ({ event, api, args, Threads }) => {
	const action = args[0];
	const content = args.slice(1);

	if (!action)
		return api.sendMessage(
			box(
				"📘 THREAD COMMAND HELP",
				`thread ban <threadID>
thread unban <threadID>
thread search <group name>`
			),
			event.threadID,
			event.messageID
		);

	/* ===== BAN THREAD ===== */
	if (action === "ban") {
		if (!content[0])
			return api.sendMessage(
				box("❌ ERROR", "Please provide Thread ID to ban."),
				event.threadID,
				event.messageID
			);

		const tid = parseInt(content[0]);
		if (isNaN(tid))
			return api.sendMessage(box("❌ ERROR", "Invalid Thread ID."), event.threadID);

		const threadData = await Threads.getData(tid);
		if (!threadData)
			return api.sendMessage(box("❌ ERROR", "Thread not found in database."), event.threadID);

		if (threadData.data?.banned)
			return api.sendMessage(box("⚠️ INFO", "Thread already banned."), event.threadID);

		return api.sendMessage(
			box(
				"⚠️ CONFIRM BAN",
				`Thread ID : ${tid}\n\nReact 👍 to confirm BAN`
			),
			event.threadID,
			(err, info) => {
				global.client.handleReaction.push({
					name: module.exports.config.name,
					messageID: info.messageID,
					author: event.senderID,
					type: "ban",
					target: tid
				});
			}
		);
	}

	/* ===== UNBAN THREAD ===== */
	if (action === "unban") {
		if (!content[0])
			return api.sendMessage(
				box("❌ ERROR", "Please provide Thread ID to unban."),
				event.threadID,
				event.messageID
			);

		const tid = parseInt(content[0]);
		if (isNaN(tid))
			return api.sendMessage(box("❌ ERROR", "Invalid Thread ID."), event.threadID);

		const threadData = (await Threads.getData(tid)).data;
		if (!threadData)
			return api.sendMessage(box("❌ ERROR", "Thread not found."), event.threadID);

		if (threadData.banned != 1)
			return api.sendMessage(box("⚠️ INFO", "Thread is not banned."), event.threadID);

		return api.sendMessage(
			box(
				"⚠️ CONFIRM UNBAN",
				`Thread ID : ${tid}\n\nReact 👍 to confirm UNBAN`
			),
			event.threadID,
			(err, info) => {
				global.client.handleReaction.push({
					name: module.exports.config.name,
					messageID: info.messageID,
					author: event.senderID,
					type: "unban",
					target: tid
				});
			}
		);
	}

	/* ===== SEARCH THREAD ===== */
	if (action === "search") {
		if (!content.length)
			return api.sendMessage(
				box("❌ ERROR", "Please enter group name to search."),
				event.threadID,
				event.messageID
			);

		const keyword = content.join(" ").toLowerCase();
		const allThreads = (await Threads.getAll(["threadID", "name"])).filter(t => t.name);

		const matches = allThreads.filter(t =>
			t.name.toLowerCase().includes(keyword)
		);

		if (!matches.length)
			return api.sendMessage(
				box("🔍 SEARCH RESULT", "No matching groups found."),
				event.threadID
			);

		let msg = "";
		matches.forEach((t, i) => {
			msg += `${i + 1}. ${t.name}\n🆔 ${t.threadID}\n\n`;
		});

		return api.sendMessage(
			box("🔍 SEARCH RESULT", msg),
			event.threadID
		);
	}

	/* ===== INVALID ===== */
	return api.sendMessage(
		box("❌ INVALID", "Unknown action. Use: ban | unban | search"),
		event.threadID,
		event.messageID
	);
};
