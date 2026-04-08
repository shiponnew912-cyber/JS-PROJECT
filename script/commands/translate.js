const axios = require("axios");

module.exports.config = {
  name: "trans",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "SaGor",
  description: "Translate any message by replying to it",
  commandCategory: "Utilities",
  usages: "[language code]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;
  const prefix = global.config.PREFIX || global.config.prefix || "!";

  // 🌍 Language names
  const langNames = {
    auto: "Auto Detect",

    en: "English",
    hi: "Hindi",
    ur: "Urdu",
    es: "Spanish",
    fr: "French",
    de: "German",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    ru: "Russian",
    pt: "Portuguese",
    it: "Italian",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    vi: "Vietnamese",
    th: "Thai",
    id: "Indonesian",

    // 🇮🇳 Indian Languages
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
    pa: "Punjabi"
  };

  // ❌ Not replying
  if (!messageReply) {
    return api.sendMessage(
      '❌ Please reply to a message to translate it.\n\n' +
      'Usage:\n' +
      `${prefix}translate <language>\n\n` +
      'Examples:\n' +
      `• ${prefix}translate en\n` +
      `• ${prefix}translate hi\n` +
      `• ${prefix}translate ur`,
      threadID,
      messageID
    );
  }

  // ❌ No language provided
  if (!args[0]) {
    return api.sendMessage(
      `❌ Please provide a target language code.\nExample: ${prefix}translate en`,
      threadID,
      messageID
    );
  }

  const targetLang = args[0].toLowerCase();
  const textToTranslate = messageReply.body;

  if (!textToTranslate) {
    return api.sendMessage(
      "❌ Replied message Error.",
      threadID,
      messageID
    );
  }

  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;

    const res = await axios.get(url);

    if (!res.data || !res.data[0]) {
      throw new Error("Invalid API response");
    }

    const translatedText = res.data[0].map(item => item[0]).join("");
    const detectedLang = res.data[2] || "auto";

    const sourceLangName = langNames[detectedLang] || detectedLang.toUpperCase();
    const targetLangName = langNames[targetLang] || targetLang.toUpperCase();

    const response =
      `🌐 Translation\n` +
      `┏━━━━━━━━━━━━━━━┓\n\n` +
      `🔎 From: ${sourceLangName}\n` +
      `🎯 To: ${targetLangName}\n\n` +
      `📄 Result:\n${translatedText}\n\n` +
      `┗━━━━━━━━━━━━━━━┛`;

    return api.sendMessage(response, threadID, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(
      "❌ Translation failed. Invalid language code ya API issue.",
      threadID,
      messageID
    );
  }
};
