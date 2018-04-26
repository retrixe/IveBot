# IveBot

The bot that created the iPhone X. It's strictly private. You may run it locally,  but it's not a useful bot to others and tailored for a specific need.

**Requires Node.js 8.5.0 or higher.**

It's planned to have some nifty commands like /assistant which directly communicates with the Google Assistant gRPC API. You heard that, Google Assistant in a Discord bot.

2.0 is built upon Next.js and releasing with administrative commands and a web dashboard. 1.0 is no longer supported and 2.0 is now recommended (canary 6 onwards) because it has reached a high stability phase. 1.0 is still very rock-solid but lacks a lot of features that can be gained through 2.0, hence I recommend moving to 2.0. There is very little change required to your configuration in this regard.

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
- `/repeat` for test pilots
- `/request`
- `/urban`
- `/cat` and `/dog`
- `/say`
- `/version`, `/ping` and `/about`

</details>
<hr />

## Configuration

Make a file named `config.json5` in the top-level directory. It should be something like this:

```json
{
  "token": "<insert token here>",
  "testPilots": ["array of people who can use test pilot commands via user ID"],
  "NASAtoken": "<to enable /astronomy-picture-of-the-day or /apod>"
}
```

You can use comments in JSON5.
