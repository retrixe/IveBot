# IveBot

The bot that created the iPhone X. It's strictly private. You may run it locally, but it's not a useful bot to others and tailored for a specific need.

**Requires Node.js 24.x or higher.**

It includes many different and useful commands, from games to tools, utilities, fun commands, moderation and even a `/ai` command which generates text responses to inputs. It also has a web dashboard with various features like auto role, public roles and join/leave messages.

<hr />
<details><summary>Commands</summary>

<br />

`/halp` and `/help` - The most innovative help.

**Games.**

- `/gunfight`
- `/random`
- `/randomword`
- `/choose`
- `/reverse`
- `/trivia`
- `/8ball`
- `/repeat`
- `/distort`

**Random searches.**

- `/urban`
- `/cat` and `/dog`
- `/robohash`
- `/zalgo` `/dezalgo`
- `/namemc`
- `/astronomy-picture-of-the-day` or `/apod`
- `/currency`
- `/xkcd`
- `/httpcat`
- `/google`

**Utilities.**

- `/request`
- `/token`
- `/weather`
- `/say` | `/type`
- `/editLastSay`
- `/reminderlist`
- `/remindme`
- `/leave`
- `/ocr`
- `/avatar`
- `/userinfo`
- `/serverinfo`
- `/creationtime`
- `/about`, `/ping`, `/uptime` and `/version`
- `/emojiImage`
- `/giverole` and `/takerole`
- `/notify`
- `/hastebin`
- `/calculate`
- `/temperature`
- `/suppressEmbed`

**Administrative commands.**

- `/ban`, `/unban`, `/kick`, `/mute` and `/unmute`
- `/addEmoji`, `/deleteEmoji` and `/editEmoji`
- `/deleteChannel` and `/editChannel`
- `/warn`, `/warnings`, `/clearwarns` and `/removewarn`
- `/changevoiceregion` and `/listvoiceregions`
- `/perms`
- `/purge`
- `/slowmode`

[Complete list of commands along with their descriptions available here.](https://github.com/retrixe/IveBot/blob/master/src/commands/help.ts#L6)

</details>
<hr />

## Configuration

Set up a MongoDB instance and note its URL. You can set it to store its data in `database` within this folder (you must first make the folder before starting MongoDB)

Make a file named `config.json5` in the top-level directory. It should be something like this:

```json
{
  "token": "<insert token here>",
  "mongoUrl": "<the link to your MongoDB database instance>",
  "host": "<your user ID to give you certain privileges like /remoteexec>",
  "testPilots": ["array of people who can use test pilot commands via user ID"],
  "dashboardUrl": "<optional, URL to the dashboard with http(s):// and no / at the end>",
  "jwtSecret": "<optional, leave empty if not using dashboard: JWT secret from dashboard>",

  // optional to enable various commands
  "nasaApiKey": "<to enable /astronomy-picture-of-the-day or /apod>",
  "oxfordApi": {
    "appKey": "<enables /define, use Oxford Dictionary API>",
    "appId": "<read above>"
  },
  "weatherApiKey": "<an http://openweathermap.org API key to enable /weather>",
  "fixerApiKey": "<an http://fixer.io API key to enable /currency>",
  "gcloudApiKey": "<a http://cloud.google.com/vision API key for /ocr and text recognition>",
  "openaiApiKey": "<an OpenAI API key to enable /ai command (experimental)>",
}
```

You can use comments in JSON5. If you're using a deployment service like Now which supports secrets, then you can secure your token and MongoDB database URL by setting the value of both keys to `dotenv` and then setting the IVEBOT_TOKEN environment variable to your token and the MONGO_URL env variable to the MongoDB instance URL.

## Dashboard Configuration

Since 4.0 onwards, the dashboard has been separated into its own independent project, and needs to be setup and run separately. Refer to the README.md in the `dashboard/` folder.

IveBot uses the `yarn` package manager, and Yarn workspaces are used for the bot (`ivebot`) and the dashboard (`ivebot-dashboard`). Constraints are in place to ensure that the dependencies of the dashboard and bot remain in sync. This may cause issues if updating shared dependencies, so look at both lockfiles closely when updating a shared dependency.
