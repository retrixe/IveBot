# IveBot

The bot that created the iPhone X. It's strictly private. You may run it locally,  but it's not a useful bot to others and tailored for a specific need.

**Requires Node.js 8.5.0 or higher.**

It includes many different and useful commands, from games to tools, utilities, fun commands and moderation. It also uses Next.js to provide a web dashboard as part of the bot itself.

It's planned to have some nifty commands like /assistant which directly communicates with the Google Assistant gRPC API. You heard that, Google Assistant in a Discord bot.

1.0 and 2.0 used discord.io while 3.0 uses Eris and is much more refined and full-featured. It is highly recommended to use 3.0 as older versions are unsupported and may not connect to Discord's API gateway anymore.

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
- `/8ball`
- `/repeat`
- `/calculate`
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

**Utilities.**

- `/request`
- `/token`
- `/weather`
- `/say` | `/type`
- `/editLastSay`
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

**Administrative commands.**

- `/deleteChannel` and `/editChannel`
- `/changeserverregion` and `/listserverregions`
- `/ban`, `/unban`, `/kick`, `/mute` and `/unmute`
- `/warn` and `/warnings` | `/clearwarns` and `/removewarn`
- `/addEmoji`, `/deleteEmoji` and `/editEmoji`
- `/purge`
- `/slowmode`

[Complete list of commands along with their descriptions available here.](https://github.com/retrixe/IveBot/blob/master/server/bot/commands/help.ts#L6)

</details>
<hr />

## Configuration

Set up a MongoDB instance and note its URL. You can set it to store its data in `database` within this folder (you must first make the folder before starting MongoDB)

Make a file named `config.json5` in the top-level directory. It should be something like this:

```json
{
  "token": "<insert token here>",
  "testPilots": ["array of people who can use test pilot commands via user ID"],
  "NASAtoken": "<to enable /astronomy-picture-of-the-day or /apod>",
  "oxfordAPI": {
    "appKey": "<enables /define, use Oxford Dictionary API>",
    "appId": "<read above>"
  },
  "host": "<your user ID to give you certain privileges like /remoteexec>",
  "weatherAPIkey": "<an http://openweathermap.org API key to enable /weather>",
  "fixerAPIkey": "<an http://fixer.io API key to enable /currency>",
  "cvAPIkey": "<a http://cloud.google.com/vision API key for /ocr and text recognition>",
  "mongoURL": "<the link to your MongoDB database instance>",
  "rootURL": "<the root link to the dashboard with http(s):// and no / at the end>"
}
```

You can use comments in JSON5. If you're using a deployment service like Now which supports secrets, then you can secure your token and MongoDB database URL by setting the value of both keys to `dotenv` and then setting the IVEBOT_TOKEN environment variable to your token and the MONGO_URL env variable to the MongoDB instance URL.
