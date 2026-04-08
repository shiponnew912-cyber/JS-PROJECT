module.exports.config = {
 name: "goiadmin",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "SaGor",
 description: "Bot will rep ng tag admin or rep ng tagbot ",
 commandCategory: "Other",
 usages: "",
 cooldowns: 1
};
module.exports.handleEvent = function({ api, event }) {
 if (event.senderID !== "61581197276223") {
 var aid = ["61581197276223"];
 for (const id of aid) {
 if ( Object.keys(event.mentions) == id) {
 var msg =["আমার বস সাগরকে আর একবার মেনশন দিলে তোমার নাকের মধ্যে ঘুষি মারমু😡",
      "বস সাগরকে আর একবার মেনশন দিলে খবর আছে তোমার 😠",
      "বস সাগর এখন অনেক বিজি তাকে মেনশন দিয়ে ডিস্টার্ব কইরো না 🥰",
      "সাগর বস এখন অনেক বিজি 😡😡",
      "Mention দিস না, সাগর বসের মন ভালো নেই 💔🥀",
      "এত মেনশন না দিয়ে ইনবক্সে আসো 🤷‍♂️",
      "Mention দিলে ঠোঁটের কালার change কইরা দিমু 💋😾",
      "সাগর বস এখন বিজি, যা বলার আমাকে বল 😼",
      "Mention না দিয়ে সিরিয়াস প্রেম করতে চাইলে ইনবক্স 😏",
      "সাগর প্রচুর বিজি 🥵🥀",
      "চুমু খাওয়ার বয়স চকলেট খেয়ে শেষ 🤗"];
 return api.sendMessage({body: msg[Math.floor(Math.random()*msg.length)]}, event.threadID, event.messageID);
 }
 }}
};
module.exports.run = async function({}) {
 }
