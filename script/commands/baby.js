const axios = require('axios');

const baseApiUrl = async () => {
    const base = await axios.get(`https://noobs-api.top/dipto`);
    return base.data.api;
};

module.exports.config = {
  name: "baby",
  version: "6.9.9",
  credits: "dipto",
  cooldowns: 0,
  hasPermssion: 0,
  description: "better than all sim simi",
  commandCategory: "chat",
  category: "chat",
  usePrefix: true,
  prefix: true,
  usages: `[anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR\nall OR\nedit [YourMessage] - [NewMessage]`,
};

module.exports.run = async function ({ api, event, args, Users }) {
  try {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;

    if (!args[0]) {
      const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
      const r = ran[Math.floor(Math.random() * ran.length)];
      return api.sendMessage(r, event.threadID, event.messageID);
    }

    if (args[0] === 'remove') {
      const fina = dipto.replace("remove ", "");
      const respons = await axios.get(`${link}?remove=${fina}&senderID=${uid}`);
      return api.sendMessage(respons.data.message, event.threadID, event.messageID);
    }

    if (args[0] === 'rm' && dipto.includes('-')) {
      const [fi, f] = dipto.replace("rm ", "").split(' - ');
      const respons = await axios.get(`${link}?remove=${fi}&index=${f}`);
      return api.sendMessage(respons.data.message, event.threadID, event.messageID);
    }

    if (args[0] === 'list') {
      if (args[1] === 'all') {
        const res = await axios.get(`${link}?list=all`);
        const data = res.data.teacher.teacherList;
        const teachers = await Promise.all(data.map(async (item) => {
          const number = Object.keys(item)[0];
          const value = item[number];
          const name = await Users.getName(number) || "unknown";
          return { name, value };
        }));
        teachers.sort((a, b) => b.value - a.value);
        const output = teachers.map((teacher, index) => `${index + 1}/ ${teacher.name}: ${teacher.value}`).join('\n');
        return api.sendMessage(`Total Teach = ${res.data.length}\n\n👑 | List of Teachers of baby\n${output}`, event.threadID, event.messageID);
      } else {
        const respo = await axios.get(`${link}?list=all`);
        return api.sendMessage(`Total Teach = ${respo.data.length}`, event.threadID, event.messageID);
      }
    }

    if (args[0] === 'msg' || args[0] === 'message') {
      const fuk = dipto.replace("msg ", "");
      const respo = await axios.get(`${link}?list=${fuk}`);
      return api.sendMessage(`Message ${fuk} = ${respo.data.data}`, event.threadID, event.messageID);
    }

    if (args[0] === 'edit') {
      const command = dipto.split(' - ')[1];
      if (command.length < 2) {
        return api.sendMessage('❌ | Invalid format! Use edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
      }
      const res = await axios.get(`${link}?edit=${args[1]}&replace=${command}`);
      return api.sendMessage(`changed ${res.data.message}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
      const [comd, command] = dipto.split(' - ');
      const final = comd.replace("teach ", "");
      if (command.length < 2) {
        return api.sendMessage('❌ | Invalid format! Use [YourMessage] - [Reply1], [Reply2], [Reply3]... OR remove [YourMessage] OR list OR edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
      }
      const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
      const name = await Users.getName(re.data.teacher) || "";
      return api.sendMessage(`✅ Replies added ${re.data.message}\nTeacher: ${name || "unknown"}\nTeachs: ${re.data.teachs}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'amar') {
      const [comd, command] = dipto.split(' - ');
      const final = comd.replace("teach ", "");
      if (command.length < 2) {
        return api.sendMessage('❌ | Invalid format! Use [YourMessage] - [Reply1], [Reply2], [Reply3]... OR remove [YourMessage] OR list OR edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
      }
      const re = await axios.get(`${link}?teach=${final}&senderID=${uid}&reply=${command}&key=intro`);
      return api.sendMessage(`✅ Replies added ${re.data.message}`, event.threadID, event.messageID);
    }

    if (args[0] === 'teach' && args[1] === 'react') {
      const [comd, command] = dipto.split(' - ');
      const final = comd.replace("teach react ", "");
      if (command.length < 2) {
        return api.sendMessage('❌ | Invalid format! Use [teach] [YourMessage] - [Reply1], [Reply2], [Reply3]... OR [teach] [react] [YourMessage] - [react1], [react2], [react3]... OR remove [YourMessage] OR list OR edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
      }
      const re = await axios.get(`${link}?teach=${final}&react=${command}`);
      return api.sendMessage(`✅ Replies added ${re.data.message}`, event.threadID, event.messageID);
    }

    if (['amar name ki', 'amr nam ki', 'amar nam ki', 'amr name ki'].some(phrase => dipto.includes(phrase))) {
      const response = await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`);
      return api.sendMessage(response.data.reply, event.threadID, event.messageID);
    }

     const a = (await axios.get(`${link}?text=${dipto}&senderID=${uid}&font=1`)).data.reply;
    return api.sendMessage(a, event.threadID,
        (error, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            lnk: a,
            apiUrl: link
          });
        }, event.messageID);

  } catch (e) {
    console.error('Error in command execution:', e);
    return api.sendMessage(`Error: ${e.message}`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
try{
  if (event.type == "message_reply") {
    const reply = event.body.toLowerCase();
    if (isNaN(reply)) {
      const b = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(reply)}&senderID=${event.senderID}&font=1`)).data.reply;
      await api.sendMessage(b, event.threadID, (error, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            lnk: b
          });
        }, event.messageID,
      )}}
}catch(err){
    return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
}};

   
module.exports.handleEvent = async function ({ api, event }) {
try{
    const body = event.body ? event.body.toLowerCase() : ""
    if(body.startsWith("baby") || body.startsWith("bby") || body.startsWith("bot") || body.startsWith("বট")){
        const arr = body.replace(/^\S+\s*/, "")

      if(!arr) {

    const msgs = [
    "বেশি bot Bot করলে leave নিবো কিন্তু😒😒",
    "শুনবো না😼 তুমি আমার বস সাগর কে প্রেম করাই দাও নাই🥺পচা তুমি🥺",
    "আমি আবাল দের সাথে কথা বলি না,ok😒",
    "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈",
    "Bolo Babu, তুমি কি আমার বস সাগর কে ভালোবাসো? 🙈💋",
    "বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑",
    "হ্যা বলো😒, তোমার জন্য কি করতে পারি😐😑?",
    "এতো ডাকছিস কেন?গালি শুনবি নাকি? 🤬",
    "I love you janu🥰",
    "আরে Bolo আমার জান ,কেমন আছো?😚",
    "আজ বট বলে অসম্মান করছি,😰😿",
    "Hop beda😾,Boss বল boss😼",
    "চুপ থাক ,নাই তো তোর দাত ভেগে দিবো কিন্তু",
    "আমাকে না ডেকে মেয়ে হলে বস সাগর এর ইনবক্সে চলে যা 🌚😂",
    "আমাকে বট না বলে , বস সাগর কে জানু বল জানু 😘",
    "বার বার Disturb করছিস কোনো😾,আমার জানুর সাথে ব্যাস্ত আছি😋",
    "আরে বলদ এতো ডাকিস কেন🤬",
    "আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘",
    "আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😒",
    "হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘",
    "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস 😉😋🤣",
    "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂",
    "আমাকে ডেকো না,আমি বস সাগর এর সাথে ব্যাস্ত আছি",
    "কি হলো , মিস্টেক করচ্ছিস নাকি🤣",
    "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",
    "জান মেয়ে হলে বস সাগর এর ইনবক্সে চলে যাও 😍🫣💕",
    "কালকে দেখা করিস তো একটু 😈",
    "হা বলো, শুনছি আমি 😏",
    "আর কত বার ডাকবি ,শুনছি তো",
    "হুম বলো কি বলবে😒",
    "বলো কি করতে পারি তোমার জন্য",
    "আমি তো অন্ধ কিছু দেখি না🐸 😎",
    "আরে বোকা বট না জানু বল জানু😌",
    "বলো জানু 🌚",
    "তোর কি চোখে পড়ে না আমি ব্যাস্ত আছি😒",
    "হুম জান তোমার ওই খানে উম্মহ😑😘",
    "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘",
    "jang hanga korba😒😬",
    "হুম জান তোমার অইখানে উম্মমাহ😷😘",
    "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি..!🥰",
    "ভালোবাসার নামক আবলামি করতে চাইলে বস সাগর এর ইনবক্সে গুতা দিন ~🙊😘🤣",
    "আমাকে এতো না ডেকে বস সাগর এর কে একটা গফ দে 🙄",
    "আমাকে এতো না ডেকছ কেন ভলো টালো বাসো নাকি🤭🙈",
    "🌻🌺💚-আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻",
    "আমি এখন বস সাগর এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😏 ধন্যবাদ-🤝🌻",
    "আমাকে না ডেকে আমার বস সাগর কে একটা জি এফ দাও-😽🫶🌺",
    "ঝাং থুমালে আইলাপিউ পেপি-💝😽",
    "উফফ বুঝলাম না এতো ডাকছেন কেনো-😤😡😈",
    "জান তোমার বান্ধবী রে আমার বস সাগর এর হাতে তুলে দিবা-🙊🙆‍♂",
    "আজকে আমার মন ভালো নেই তাই আমারে ডাকবেন না-😪🤧",
    "ঝাং 🫵থুমালে য়ামি রাইতে পালুপাসি উম্মম্মাহ-🌺🤤💦",
    "চুনা ও চুনা আমার বস সাগর এর হবু বউ রে কেও দেকছো খুজে পাচ্ছি না😪🤧😭",
    "স্বপ্ন তোমারে নিয়ে দেখতে চাই তুমি যদি আমার হয়ে থেকে যাও-💝🌺🌻",
    "জান হাঙ্গা করবা-🙊😝🌻",
    "তোদের জন্য একটুও শান্তি নাই! শুধু ডিস্টার্ব করিস 😿",
    "জান মেয়ে হলে চিপায় আসো বস সাগর এর থেকে অনেক ভালোবাসা শিখছি তোমার জন্য-🙊🙈😽",
    "ইসস এতো ডাকো কেনো লজ্জা লাগে তো-🙈🖤🌼",
    "আমার বস সাগর এর পক্ষ থেকে তোমারে এতো এতো ভালোবাসা-🥰😽🫶",
    "ভালোবাসা করতে চাইলে বস সাগর এর ইনবক্স যাও-🙊🥱👅",
    "আমার জান তুমি শুধু আমার 💝",
    "কিরে প্রেম করবি তাহলে বস সাগর এর ইনবক্সে গুতা দে 😘",
    "জান আমার বস সাগর কে বিয়ে করবা-🙊😘🥳"
    ];

    return api.sendMessage(
      msgs[Math.floor(Math.random()*msgs.length)],
      event.threadID,
      (error, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      },
      event.messageID
    );
      }

      const a = (await axios.get(`${await baseApiUrl()}/baby?text=${encodeURIComponent(arr)}&senderID=${event.senderID}&font=1`)).data.reply;

      return api.sendMessage(a, event.threadID, (error, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID,
          lnk: a
        });
      }, event.messageID);
    }

}catch(err){
    return api.sendMessage(`Error: ${err.message}`, event.threadID, event.messageID);
}};
