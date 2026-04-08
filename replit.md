# ARIF BABU BOT

## Overview
A Facebook Messenger bot based on the Mirai Bot framework. It connects to Facebook using cookie-based authentication and provides a wide range of commands and event handlers via a modular system.

## Architecture

- **Runtime:** Node.js 20.x
- **Package Manager:** npm
- **Entry Point:** `index.js` — launches the Express web dashboard and spawns the bot process
- **Bot Core:** `ARIF-BABU.js` — initializes the Facebook connection and loads command/event modules
- **Database:** SQLite via Sequelize (stored in `includes/data.sqlite`)
- **Web Dashboard:** Express server on port 5000 serving `index.html`

## Project Layout

```
index.js          - Launcher: Express server + bot process manager
ARIF-BABU.js      - Core bot logic and module loader
config.json       - Bot configuration (prefix, admin IDs, DB settings)
COOKIES.txt       - Facebook session cookies (required for bot to work)
ARIF-FCA.json     - Facebook app state storage
models/
  commands/       - Individual bot command modules (.js files)
  events/         - Facebook event handler modules (.js files)
  cache/          - Temporary storage for command data
includes/
  database/       - Sequelize models and DB initialization
  handle/         - Command, reply, and reaction handlers
  controllers/    - User, thread, and currency management
  listen.js       - Main message listener
languages/        - Localization files (.lang format)
utils/            - Logging utilities
```

## Configuration

The bot is configured via `config.json`:
- `PREFIX`: Bot command prefix (default: `#`)
- `ADMINBOT`: Array of Facebook user IDs with admin privileges
- `APPSTATEPATH`: Path to cookies file (`COOKIES.txt`)
- `DATABASE`: SQLite database settings

## Running

The web dashboard runs on port 5000 and is always accessible. The bot process requires valid Facebook cookies in `COOKIES.txt` to connect and function.

```
npm start
```

## Important Notes

- The bot needs valid Facebook session cookies in `COOKIES.txt` to connect to Facebook
- The web dashboard at `/` shows bot status; `/status` returns JSON status; `/health` is a health check
- Commands are auto-loaded from `models/commands/` and events from `models/events/`
- The bot auto-installs missing npm packages required by individual command modules at runtime
