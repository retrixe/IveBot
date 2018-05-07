# IveBot

The bot that created the iPhone X. It's strictly private. You may run it locally,  but it's not a useful bot to others and tailored for a specific need.

**Requires Node.js 8.5.0 or higher.**

It's planned to have some nifty commands like /assistant which directly communicates with the Google Assistant gRPC API. You heard that, Google Assistant in a Discord bot.

2.0 is built upon Next.js and coming with administrative commands and a web dashboard. 1.0 is still supported and recommended because of its stability.

<hr />
<details><summary>Commands</summary>

<br />

- `/help` and `/halp`
- `/gunfight`
- `/choose`
- `/reverse`
- `/8ball`
- `/robohash`
- `/zalgo`
- `/repeat`
- `/request` for test pilots
- `/urban`
- `/cat` and `/dog`
- `/astronomy-picture-of-the-day` or `/apod`
- `/say`
- `/avatar`
- `/version`, `/ping` and `/about`
- `/ban`, `/unban`, `/kick`, `/mute` and `/unmute`
- `/addrole` and `/removerole`

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
  "fixerAPIkey": "<an http://fixer.io API key to enable /currencyconvert>",
  "mongoURL": "<the link to your MongoDB database instance>"
}
```

You can use comments in JSON5. If you're using a deployment service like Now which supports secrets, then you can secure your token and MongoDB database URL by setting the value of both keys to `dotenv` and then setting the IVEBOT_TOKEN environment variable to your token and the MONGO_URL env variable to the MongoDB instance URL.
