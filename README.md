# IveBot

The bot that created the iPhone X. It's strictly private. You may run it locally,  but it's not a useful bot to others and tailored for a specific need.

**Requires Node.js 8.5.0 or higher.**

It's planned to have some nifty commands like /assistant which directly communicates with the Google Assistant gRPC API. You heard that, Google Assistant in a Discord bot.

2.0 is built upon Next.js and coming with music, administrative commands and a web dashboard. 1.0 is still supported and recommended because of its stability.

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


## Self hosting information

You will need to install Yarn (or npm), run `yarn`/`npm i` from the CLI in the bot directory and then configure the project by creating a file `.env` which should have the following contents in the root directory.

```bash
PRISMA_STAGE=<dev/stable/something else depending on which stage you wish to deploy the database to>
PRISMA_CLUSTER=<this is in database/prisma.yml when running `prisma init ivebot` in another directory>
PRISMA_SECRET=<this can be anything but used for authentication>
```

Then run `yarn prisma deploy`/`npm run prisma deploy` from the CLI to deploy the database.

Once done, proceed with configuration.

To start the bot, you need to run `yarn dev`/`npm run dev` if in development mode, or `yarn build`/`npm run build` to build the bot followed by `yarn start`/`npm start` to start the bot in production (no live reload, verbose logging or playground).

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
