const assets = require('@miraipr0ject/assets');
const crypto = require('crypto');
const os = require("os");
const axios = require("axios");
const config = require('../config.json');
const package = require('../package.json');
const fs = require('fs');
const path = require('path');

// ==================== YOUTUBE FUNCTIONS ====================
module.exports.getYoutube = async function (videoId, action, format) {
		try {
				if (action === "search") {
						const youtubeSearch = require("youtube-search-api");
						if (!videoId) {
								console.log("Missing search keyword");
								return [];
						}
						const searchResult = await youtubeSearch.GetListByKeyword(videoId, false, 6);
						return searchResult.items || [];
				}

				if (action === "getLink") {
						if (!videoId) {
								throw new Error("Video ID is required");
						}

						const response = await axios.post("https://aiovideodl.ml/wp-json/aio-dl/video-data/", {
								url: "https://www.youtube.com/watch?v=" + videoId
						});

						const videoData = response.data;

						if (format === "video") {
								return {
										title: videoData.title,
										duration: videoData.duration,
										download: {
												SD: videoData.medias?.[1]?.url || null,
												HD: videoData.medias?.[2]?.url || null
										}
								};
						}

						if (format === "audio") {
								return {
										title: videoData.title,
										duration: videoData.duration,
										download: videoData.medias?.[3]?.url || null
								};
						}
				}
		} catch (error) {
				console.error("YouTube API Error:", error.message);
				throw error;
		}
};

// ==================== ERROR HANDLING ====================
module.exports.throwError = function (command, threadID, messageID) {
		try {
				const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
				const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;

				return global.client.api.sendMessage(
						global.getText("utils", "throwError", prefix, command),
						threadID,
						messageID
				);
		} catch (error) {
				console.error("Error in throwError:", error);
		}
};

// ==================== TEXT CLEANING ====================
module.exports.cleanAnilistHTML = function (text) {
		if (!text || typeof text !== 'string') return '';

		const replacements = [
				['<br>', '\n'],
				['<br/>', '\n'],
				['<br />', '\n'],
				[/<\/?(i|em)>/g, '*'],
				[/<\/?b>/g, '**'],
				[/~!|!~/g, '||'],
				['&amp;', '&'],
				['&lt;', '<'],
				['&gt;', '>'],
				['&quot;', '"'],
				['&#039;', "'"],
				['&nbsp;', ' ']
		];

		let cleanedText = text;
		for (const [pattern, replacement] of replacements) {
				cleanedText = cleanedText.replace(pattern, replacement);
		}

		return cleanedText;
};

// ==================== FILE DOWNLOAD ====================
module.exports.downloadFile = async function (url, filePath) {
		try {
				const { createWriteStream } = require('fs');

				// Create directory if it doesn't exist
				const dir = path.dirname(filePath);
				if (!fs.existsSync(dir)) {
						fs.mkdirSync(dir, { recursive: true });
				}

				const response = await axios({
						method: 'GET',
						responseType: 'stream',
						url,
						timeout: 30000 // 30 seconds timeout
				});

				const writer = createWriteStream(filePath);
				response.data.pipe(writer);

				return new Promise((resolve, reject) => {
						writer.on('finish', () => resolve(filePath));
						writer.on('error', reject);
				});
		} catch (error) {
				console.error("Download error:", error.message);
				throw error;
		}
};

// ==================== HTTP REQUEST ====================
module.exports.getContent = async function (url, options = {}) {
		try {
				const response = await axios({
						method: 'GET',
						url,
						timeout: 10000,
						...options
				});

				return response.data;
		} catch (error) {
				console.error(`HTTP Error (${url}):`, error.message);
				return null;
		}
};

// ==================== RANDOM STRING GENERATOR ====================
module.exports.randomString = function (length = 10) {
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';

		for (let i = 0; i < length; i++) {
				result += characters.charAt(Math.floor(Math.random() * characters.length));
		}

		return result;
};

// ==================== ASSETS MANAGER ====================
module.exports.assets = {
		async font(name) {
				try {
						if (!assets.font.loaded) await assets.font.load();
						return assets.font.get(name);
				} catch (error) {
						console.error("Font asset error:", error);
						return null;
				}
		},

		async image(name) {
				try {
						if (!assets.image.loaded) await assets.image.load();
						return assets.image.get(name);
				} catch (error) {
						console.error("Image asset error:", error);
						return null;
				}
		},

		async data(name) {
				try {
						if (!assets.data.loaded) await assets.data.load();
						return assets.data.get(name);
				} catch (error) {
						console.error("Data asset error:", error);
						return null;
				}
		}
};

// ==================== AES ENCRYPTION ====================
module.exports.AES = {
		encrypt(cryptKey, cryptIv, plainData) {
				try {
						const key = Buffer.from(cryptKey, 'utf8');
						const iv = Buffer.from(cryptIv, 'utf8');

						const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
						let encrypted = cipher.update(plainData, 'utf8', 'hex');
						encrypted += cipher.final('hex');

						return encrypted;
				} catch (error) {
						console.error("AES encryption error:", error);
						return null;
				}
		},

		decrypt(cryptKey, cryptIv, encryptedData) {
				try {
						const key = Buffer.from(cryptKey, 'utf8');
						const iv = Buffer.from(cryptIv, 'utf8');

						const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
						let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
						decrypted += decipher.final('utf8');

						return decrypted;
				} catch (error) {
						console.error("AES decryption error:", error);
						return null;
				}
		},

		makeIv() {
				return crypto.randomBytes(16).toString('hex').slice(0, 16);
		},

		generateKey(length = 32) {
				return crypto.randomBytes(length).toString('hex').slice(0, length);
		}
};

// ==================== HOME DIRECTORY DETECTION ====================
module.exports.homeDir = function () {
		try {
				let homePath;
				let systemType;

				const home = process.env.HOME;
				const user = process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME;

				switch (process.platform) {
						case "win32": {
								homePath = process.env.USERPROFILE || 
													process.env.HOMEDRIVE + process.env.HOMEPATH || 
													home || 
													null;
								systemType = "windows";
								break;
						}
						case "darwin": {
								homePath = home || (user ? '/Users/' + user : null);
								systemType = "macos";
								break;
						}
						case "linux": {
								homePath = home || (process.getuid?.() === 0 ? '/root' : (user ? '/home/' + user : null));
								systemType = "linux";
								break;
						}
						default: {
								homePath = home || null;
								systemType = "unknown";
								break;
						}
				}

				return {
						path: typeof os.homedir === 'function' ? os.homedir() : homePath,
						type: systemType
				};
		} catch (error) {
				console.error("Home directory detection error:", error);
				return { path: null, type: "unknown" };
		}
};

// ==================== ADDITIONAL UTILITIES ====================

// Format bytes to human readable
module.exports.formatBytes = function (bytes, decimals = 2) {
		if (bytes === 0) return '0 Bytes';

		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Get current timestamp
module.exports.getTimestamp = function () {
		return Math.floor(Date.now() / 1000);
};

// Sleep function
module.exports.sleep = function (ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
};

// Check if string is valid URL
module.exports.isValidURL = function (string) {
		try {
				new URL(string);
				return true;
		} catch {
				return false;
		}
};

// Generate random number between min and max
module.exports.randomNumber = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Split array into chunks
module.exports.chunkArray = function (array, chunkSize) {
		const chunks = [];
		for (let i = 0; i < array.length; i += chunkSize) {
				chunks.push(array.slice(i, i + chunkSize));
		}
		return chunks;
};

// Get file extension
module.exports.getFileExtension = function (filename) {
		return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
};

// Check if string is JSON
module.exports.isJSON = function (string) {
		try {
				JSON.parse(string);
				return true;
		} catch {
				return false;
		}
};