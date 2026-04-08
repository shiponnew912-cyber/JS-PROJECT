const moment = require("moment-timezone");
const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login = require("fca-priyansh"); 
const axios = require("axios");
const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

// ================== 🔥 SAGOR BOT - COOKIES SYSTEM 🔥 ==================

console.log("\n" + "=".repeat(50));
console.log("🤖 SAGOR BOT - STARTING SYSTEM 🤖");
console.log("=".repeat(50) + "\n");

/* =================== GLOBAL OBJECTS INITIALIZATION ================== */

global.client = {
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: [],
    handleSchedule: [],
    handleReaction: [],
    handleReply: [],
    mainPath: process.cwd(),
    configPath: "",
    api: null,
    timeStart: null,

    getTime: function(option) {
        const formats = {
            seconds: "ss",
            minutes: "mm", 
            hours: "HH",
            date: "DD",
            month: "MM",
            year: "YYYY",
            fullHour: "HH:mm:ss",
            fullYear: "DD/MM/YYYY",
            fullTime: "HH:mm:ss DD/MM/YYYY"
        };
        return moment.tz("Asia/Dhaka").format(formats[option] || "HH:mm:ss");
    }
};

global.data = {
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: [],
    allUserID: [],
    allCurrenciesID: [],
    allThreadID: []
};

global.utils = require("./utils");
global.nodemodule = {};
global.config = {};
global.configModule = {};
global.moduleData = [];
global.language = {};

/* ========================== CONFIGURATION LOADING ========================== */

console.log("📁 Loading configuration...");

try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    const configValue = require(global.client.configPath);

    for (const key in configValue) {
        global.config[key] = configValue[key];
    }

    logger.loader("✅ Config loaded successfully!");
} catch (error) {
    logger.loader("❌ config.json not found!", "error");
    process.exit(1);
}

// Save temp config
writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

/* ========================== DATABASE CONNECTION ========================== */

const { Sequelize, sequelize } = require("./includes/database");

/* ========================== LANGUAGE SYSTEM ========================== */

try {
    const langFile = readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, 'utf-8').split(/\r?\n|\r/);
    const langData = langFile.filter(item => !item.startsWith('#') && item.trim() !== '');

    for (const item of langData) {
        const separatorIndex = item.indexOf('=');
        if (separatorIndex === -1) continue;

        const itemKey = item.slice(0, separatorIndex);
        const itemValue = item.slice(separatorIndex + 1);
        const dotIndex = itemKey.indexOf('.');

        if (dotIndex === -1) continue;

        const head = itemKey.slice(0, dotIndex);
        const key = itemKey.slice(dotIndex + 1);

        if (!global.language[head]) global.language[head] = {};
        global.language[head][key] = itemValue.replace(/\\n/g, '\n');
    }

    logger.loader("✅ Language loaded: " + (global.config.language || "en"));
} catch (error) {
    logger.loader("⚠️ Language file not found, using defaults", "warn");
}

global.getText = function(...args) {
    if (!global.language[args[0]] || !global.language[args[0]][args[1]]) {
        return args[1] || "Text not found";
    }

    let text = global.language[args[0]][args[1]];
    for (let i = 2; i < args.length; i++) {
        text = text.replace(new RegExp(`%${i-1}`, 'g'), args[i]);
    }
    return text;
};

/* ========================== APPSTATE LOADING ========================== */
// MODIFIED: Handles multiple formats including semicolon-separated cookies

let appState;
try {
    const appStatePath = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));

    if (!existsSync(appStatePath)) {
        throw new Error(`File not found: ${appStatePath}`);
    }

    logger.loader(`📁 Reading from: ${appStatePath}`);

    const fileContent = readFileSync(appStatePath, 'utf8');

    // Try parsing as JSON first
    try {
        appState = JSON.parse(fileContent);
        if (Array.isArray(appState) && appState.length > 0) {
            logger.loader(`✅ JSON format detected with ${appState.length} items`);

            // Validate and fix format if needed
            if (appState[0].name && !appState[0].key) {
                appState = appState.map(item => ({
                    key: item.name,
                    value: item.value,
                    domain: item.domain || ".facebook.com",
                    path: item.path || "/",
                    hostOnly: item.hostOnly || false,
                    creation: item.creation || Math.floor(Date.now() / 1000) - 86400,
                    lastAccessed: item.lastAccessed || Math.floor(Date.now() / 1000)
                }));
            }
        }
    } catch (jsonError) {
        // Not JSON, try parsing as cookies.txt
        logger.loader("📄 Not JSON, trying cookies.txt formats...");

        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        console.log(`📊 Total non-empty lines: ${lines.length}`);

        appState = [];
        let parsedCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip comments
            if (line.startsWith('#') || line.startsWith('//')) continue;

            // Try Netscape format (tab-separated)
            if (line.includes('\t')) {
                const parts = line.split('\t');
                if (parts.length >= 7) {
                    const [domain, flag, path, secure, expiration, name, value] = parts;
                    appState.push({
                        key: name,
                        value: value,
                        domain: domain,
                        path: path,
                        hostOnly: flag.toUpperCase() === 'FALSE',
                        creation: Math.floor(Date.now() / 1000) - 86400,
                        lastAccessed: Math.floor(Date.now() / 1000)
                    });
                    parsedCount++;
                    continue;
                }
            }

            // Try semicolon-separated format (like from browser console)
            // Example: datr=CwCZaeMp14epKK9vMJyscnSF; sb=CwCZagSu5hqgMfvgy...
            if (line.includes(';') && line.includes('=')) {
                console.log(`🔍 Trying semicolon format on line ${i+1}...`);

                // Split by semicolon
                const pairs = line.split(';');
                let cookieCount = 0;

                for (const pair of pairs) {
                    const trimmed = pair.trim();
                    if (trimmed === '') continue;

                    // Split by first equals sign
                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex === -1) continue;

                    const name = trimmed.substring(0, eqIndex).trim();
                    const value = trimmed.substring(eqIndex + 1).trim();

                    if (name && value) {
                        appState.push({
                            key: name,
                            value: value,
                            domain: ".facebook.com",
                            path: "/",
                            hostOnly: false,
                            creation: Math.floor(Date.now() / 1000) - 86400,
                            lastAccessed: Math.floor(Date.now() / 1000)
                        });
                        cookieCount++;
                        parsedCount++;
                    }
                }

                console.log(`   → Parsed ${cookieCount} cookies from this line`);
                continue;
            }

            // Try space-separated (fallback)
            const parts = line.split(/\s+/);
            if (parts.length >= 7) {
                const [domain, flag, path, secure, expiration, name, value] = parts;
                appState.push({
                    key: name,
                    value: value,
                    domain: domain,
                    path: path,
                    hostOnly: flag.toUpperCase() === 'FALSE',
                    creation: Math.floor(Date.now() / 1000) - 86400,
                    lastAccessed: Math.floor(Date.now() / 1000)
                });
                parsedCount++;
            }
        }

        console.log(`📊 Parsing complete: ${parsedCount} cookies found`);

        if (parsedCount === 0) {
            throw new Error("No cookies could be parsed from the file. Unsupported format.");
        }

        // Save as JSON for future use
        writeFileSync(appStatePath.replace('.txt', '.json'), JSON.stringify(appState, null, 2));
        writeFileSync(join(global.client.mainPath, "appstate.json"), JSON.stringify(appState, null, 2));
        logger.loader(`💾 Saved appstate.json with ${appState.length} cookies`);
    }

    // Final validation
    if (!Array.isArray(appState)) {
        throw new Error("Appstate is not an array");
    }

    if (appState.length === 0) {
        throw new Error("Appstate array is empty");
    }

    // Filter out invalid entries
    appState = appState.filter(item => item.key && item.value);

    if (appState.length === 0) {
        throw new Error("No valid cookies found after filtering");
    }

    logger.loader(`✅ Final appstate ready with ${appState.length} valid cookies`);

    // Print first few cookies for verification (without values)
    console.log("\n📋 First 3 cookies loaded:");
    appState.slice(0, 3).forEach((cookie, idx) => {
        console.log(`   ${idx+1}. ${cookie.key}=${cookie.value.substring(0, 10)}... (domain: ${cookie.domain})`);
    });
    console.log("");

} catch (error) {
    logger.loader(`❌ Appstate loading failed: ${error.message}`, "error");
    console.error(error);
    console.log("\n🔍 TROUBLESHOOTING TIPS:");
    console.log("1. Make sure cookies.txt exists in the bot folder");
    console.log("2. Export cookies in one of these formats:");
    console.log("   - Netscape format (from browser extensions)");
    console.log("   - Semicolon-separated (from browser console)");
    console.log("   - JSON format");
    console.log("3. Try online converter: cookies.txt to appstate.json");
    console.log("4. Manual method: Create appstate.json with this format:");
    console.log('   [{"key":"c_user","value":"12345","domain":".facebook.com","path":"/"},...]\n');
    process.exit(1);
}

/* ========================== COMMAND LOADER FUNCTION ========================== */

function loadCommands(api) {
    console.log("\n📂 Loading commands...");

    const commandPath = join(global.client.mainPath, 'script/commands');
    const commandFiles = readdirSync(commandPath).filter(file => 
        file.endsWith('.js') && 
        !file.includes('example') && 
        !global.config.commandDisabled?.includes(file)
    );

    let loadedCount = 0;
    let failedCount = 0;

    for (const file of commandFiles) {
        try {
            const module = require(join(commandPath, file));

            if (!module.config || !module.run) {
                throw new Error("Invalid module structure");
            }

            if (global.client.commands.has(module.config.name)) {
                throw new Error(`Command name "${module.config.name}" already exists`);
            }

            if (module.config.dependencies) {
                installDependencies(module.config.dependencies, module.config.name);
            }

            if (module.config.envConfig) {
                if (!global.configModule[module.config.name]) {
                    global.configModule[module.config.name] = {};
                }
                for (const [key, value] of Object.entries(module.config.envConfig)) {
                    global.configModule[module.config.name][key] = 
                        global.config[module.config.name]?.[key] || value;
                }
            }

            if (module.onLoad) {
                module.onLoad({ api, models: null });
            }

            if (module.handleEvent) {
                global.client.eventRegistered.push(module.config.name);
            }

            global.client.commands.set(module.config.name, module);
            loadedCount++;

        } catch (error) {
            logger.loader(`❌ Failed to load ${file}: ${error.message}`, "error");
            failedCount++;
        }
    }

    logger.loader(`✅ Loaded ${loadedCount} commands | ❌ Failed ${failedCount} commands`);
    return { loadedCount, failedCount };
}

/* ========================== EVENT LOADER FUNCTION ========================== */

function loadEvents(api) {
    console.log("\n📂 Loading events...");

    const eventPath = join(global.client.mainPath, 'script/events');
    const eventFiles = readdirSync(eventPath).filter(file => 
        file.endsWith('.js') && 
        !global.config.eventDisabled?.includes(file)
    );

    let loadedCount = 0;
    let failedCount = 0;

    for (const file of eventFiles) {
        try {
            const event = require(join(eventPath, file));

            if (!event.config || !event.run) {
                throw new Error("Invalid event structure");
            }

            if (global.client.events.has(event.config.name)) {
                throw new Error(`Event name "${event.config.name}" already exists`);
            }

            if (event.config.dependencies) {
                installDependencies(event.config.dependencies, event.config.name);
            }

            if (event.config.envConfig) {
                if (!global.configModule[event.config.name]) {
                    global.configModule[event.config.name] = {};
                }
                for (const [key, value] of Object.entries(event.config.envConfig)) {
                    global.configModule[event.config.name][key] = 
                        global.config[event.config.name]?.[key] || value;
                }
            }

            if (event.onLoad) {
                event.onLoad({ api, models: null });
            }

            global.client.events.set(event.config.name, event);
            loadedCount++;

        } catch (error) {
            logger.loader(`❌ Failed to load ${file}: ${error.message}`, "error");
            failedCount++;
        }
    }

    logger.loader(`✅ Loaded ${loadedCount} events | ❌ Failed ${failedCount} events`);
    return { loadedCount, failedCount };
}

/* ========================== DEPENDENCY INSTALLER ========================== */

function installDependencies(dependencies, moduleName) {
    for (const [dep, version] of Object.entries(dependencies)) {
        try {
            if (!global.nodemodule[dep]) {
                if (listPackage[dep] || listbuiltinModules.includes(dep)) {
                    global.nodemodule[dep] = require(dep);
                } else {
                    const depPath = join(__dirname, 'nodemodules', 'node_modules', dep);

                    try {
                        global.nodemodule[dep] = require(depPath);
                    } catch {
                        logger.loader(`📦 Installing ${dep} for ${moduleName}...`, "warn");

                        const versionTag = (version && version !== '*') ? `@${version}` : '';
                        execSync(`npm install ${dep}${versionTag} --no-package-lock --no-save`, {
                            stdio: 'ignore',
                            cwd: join(__dirname, 'nodemodules')
                        });

                        delete require.cache[require.resolve(depPath)];
                        global.nodemodule[dep] = require(depPath);
                    }
                }
            }
        } catch (error) {
            logger.loader(`⚠️ Failed to install ${dep} for ${moduleName}`, "warn");
        }
    }
}

/* ========================== BOT INITIALIZATION ========================== */

async function initializeBot({ models }) {
    console.log("\n" + "=".repeat(50));
    console.log("🤖 LOGGING INTO FACEBOOK... 🤖");
    console.log("=".repeat(50) + "\n");

    login({ appState }, async (err, api) => {
        if (err) {
            logger.loader("❌ Login failed! Check your cookies", "error");
            console.error(err);
            process.exit(1);
        }

        api.setOptions(global.config.FCAOption || {});

        writeFileSync(
            join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"),
            JSON.stringify(api.getAppState(), null, 2)
        );

        global.client.api = api;
        global.client.timeStart = Date.now();
        global.config.version = '2.0.0';

        console.log("\n" + "=".repeat(50));
        console.log("✅ LOGIN SUCCESSFUL! ✅");
        console.log("=".repeat(50) + "\n");

        const commands = loadCommands(api);
        const events = loadEvents(api);

        console.log("\n" + "=".repeat(50));
        console.log("📊 BOT STARTUP SUMMARY 📊");
        console.log("=".repeat(50));
        console.log(`⏰ Time: ${moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY")}`);
        console.log(`📦 Commands: ${commands.loadedCount} loaded, ${commands.failedCount} failed`);
        console.log(`📦 Events: ${events.loadedCount} loaded, ${events.failedCount} failed`);
        console.log(`⚡ Startup Time: ${((Date.now() - global.client.timeStart) / 1000).toFixed(2)}s`);
        console.log("=".repeat(50) + "\n");

        try {
            unlinkSync(global.client.configPath + '.temp');
        } catch (e) {}

        const listener = require('./includes/listen')({ api, models });

        global.handleListen = api.listenMqtt((error, message) => {
            if (error) {
                logger.loader(`❌ Listener error: ${JSON.stringify(error)}`, "error");
                return;
            }

            if (['presence', 'typ', 'read_receipt'].includes(message.type)) {
                return;
            }

            if (global.config.DeveloperMode) {
                console.log(message);
            }

            return listener(message);
        });

        logger.loader("✅ Bot is now running! 🚀");
        console.log("\n" + "=".repeat(50));
        console.log("🎯 SAGOR  BOT IS ONLINE! 🎯");
        console.log("=".repeat(50) + "\n");
    });
}

/* ========================== DATABASE CONNECTION ========================== */

(async () => {
    try {
        await sequelize.authenticate();
        logger.loader("✅ Database connected successfully!");

        const models = require('./includes/database/model')({ Sequelize, sequelize });
        await initializeBot({ models });

    } catch (error) {
        logger.loader(`❌ Database connection failed: ${error.message}`, "error");
        process.exit(1);
    }
})();

/* ========================== ERROR HANDLERS ========================== */

process.on('unhandledRejection', (error) => {
    if (global.config.DeveloperMode) {
        console.error('Unhandled Rejection:', error);
    }
});

process.on('uncaughtException', (error) => {
    if (global.config.DeveloperMode) {
        console.error('Uncaught Exception:', error);
    }
});

process.on('SIGINT', () => {
    console.log("\n\n👋 Shutting down SAGOR BOT...");
    if (global.handleListen) {
        global.handleListen.stopListening();
    }
    process.exit(0);
});

// ==================== END OF MAIN FILE ====================