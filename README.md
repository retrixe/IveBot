# IveBot

The bot that created the iPhone X. It's strictly private. You may run it locally,  but it's not a useful bot to others and tailored for a specific need.

**Requires Node.js 8.5.0 or higher.**

It's planned to have some nifty commands like /assistant which directly communicates with the Google Assistant gRPC API. You heard that, Google Assistant in a Discord bot.

2.0 is built upon Meteor and coming with music, administrative commands and a web dashboard, but it does not support ARM without bundling it on an x86 computer (untested). 1.0 is still supported and recommended because of its stability.

<hr />
<details><summary>Commands</summary>

<br />

- `/help` and `/halp`
- `/gunfight`
- `/choose`
- `/reverse`
- `/8ball`
- `/repeat` for test pilots
- `/request`
- `/urban`
- `/cat` and `/dog`
- `/say`

</details>
<hr />

## Configuration

Make a file named `config.json5` in the top-level directory. It should be something like this:

```json
{
  "token": "<insert token here>",
  "testPilots": ["array of people who can use test pilot commands via user ID"]
}
```

You can use comments in JSON5.