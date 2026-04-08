module.exports.config = {
  'name': "console",
  'version': "1.0.0",
  'hasPermssion': 0x3,
  'credits': "SaGor",
  'description': "Make the console more beautiful",
  'commandCategory': "Admin-bot system",
  'usages': "console ",
  'cooldowns': 0x0
};
module.exports.handleEvent = async function ({
  api: _0x2f7126,
  args: _0x1a1d2f,
  Users: _0x6a31aa,
  event: _0x259183,
  Threads: _0x2fe63a,
  utils: _0x24dbef,
  client: _0x222c18
}) {
  let {
    messageID: _0x3c81fb,
    threadID: _0x38682a,
    senderID: _0x19abb9,
    mentions: _0x5d9116
  } = _0x259183;
  const _0xc69fe = require("chalk");
  const _0x4650b2 = require("moment-timezone");
  var _0x6aabc3 = _0x4650b2.tz("Asia/Dhaka").format("LLLL");
  const _0x56ebaa = global.data.threadData.get(_0x259183.threadID) || {};
  if (typeof _0x56ebaa.console !== "undefined" && _0x56ebaa.console == true) {
    return;
  }
  if (_0x259183.senderID == global.data.botID) {
    return;
  }
  var _0x54984b = global.data.threadInfo.get(_0x259183.threadID).threadName || "Name does not exist";
  var _0x1be7c5 = await _0x6a31aa.getNameUser(_0x259183.senderID);
  var _0x50221b = _0x259183.body || "Photos, videos or special characters";
  var _0x1b0061 = ["FF9900", "FFFF33", "33FFFF", "FF99FF", "FF3366", "FFFF66", "FF00FF", "66FF99", "00CCFF", "FF0099", "FF0066", "7900FF", "93FFD8", "CFFFDC", "FF5B00", "3B44F6", "A6D1E6", "7F5283", "A66CFF", "F05454", "FCF8E8", "94B49F", "47B5FF", "B8FFF9", "42C2FF", "FF7396"];
  var _0x56f2dd = _0x1b0061[Math.floor(Math.random() * _0x1b0061.length)];
  var _0x463ae1 = _0x1b0061[Math.floor(Math.random() * _0x1b0061.length)];
  var _0x5ded4b = _0x1b0061[Math.floor(Math.random() * _0x1b0061.length)];
  var _0x2435e1 = _0x1b0061[Math.floor(Math.random() * _0x1b0061.length)];
  var _0x5823b9 = _0x1b0061[Math.floor(Math.random() * _0x1b0061.length)];
  var _0x4fbafd = _0x1b0061[Math.floor(Math.random() * _0x1b0061.length)];
  var _0x2a1a1e = _0x1b0061[Math.floor(Math.random() * _0x1b0061.length)];
  console.log(_0xc69fe.hex('#' + _0x56f2dd)("GROUP NAME: " + _0x54984b) + "\n" + _0xc69fe.hex('#' + _0x4fbafd)("GROUP ID: " + _0x259183.threadID) + "\n" + _0xc69fe.hex('#' + _0x2a1a1e)("USER NAME: " + _0x1be7c5) + "\n" + _0xc69fe.hex('#' + _0x463ae1)("USER ID: " + _0x259183.senderID) + "\n" + _0xc69fe.hex('#' + _0x5ded4b)("MESSAGE: " + _0x50221b) + "\n" + _0xc69fe.hex('#' + _0x2435e1)("[ " + _0x6aabc3 + " ]") + "\n" + _0xc69fe.hex('#' + _0x5823b9)("◆━━━━━━━━━◆ SAGOR ◆━━━━━━━━◆\n"));
};
module.exports.languages = {
  'vi': {
    'on': "Bật",
    'off': "Tắt",
    'successText': "console thành công"
  },
  'en': {
    'on': 'on',
    'off': "off",
    'successText': "console success!"
  }
};
module.exports.run = async function ({
  api: _0x4a9d2a,
  event: _0x39eb47,
  Threads: _0x4e2882,
  getText: _0x5a7442
}) {
  const {
    threadID: _0x406157,
    messageID: _0x126ffa
  } = _0x39eb47;
  let _0x3b77c2 = (await _0x4e2882.getData(_0x406157)).data;
  if (typeof _0x3b77c2.console == "undefined" || _0x3b77c2.console == true) {
    _0x3b77c2.console = false;
  } else {
    _0x3b77c2.console = true;
  }
  await _0x4e2882.setData(_0x406157, {
    'data': _0x3b77c2
  });
  global.data.threadData.set(_0x406157, _0x3b77c2);
  return _0x4a9d2a.sendMessage((_0x3b77c2.console == false ? _0x5a7442('on') : _0x5a7442("off")) + " " + _0x5a7442("successText"), _0x406157, _0x126ffa);
};