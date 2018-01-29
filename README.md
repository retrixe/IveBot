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
  "testPilots": ["array of people who can use test pilot commands via user ID"]
}
```

You can use comments in JSON5.

### Deploying to Now

Deploying to Now is simple. It requires a Now account.

Run the following commands:

```bash
# BEFORE DOING THIS, MAKE SURE YOU HAVE PUSHED ALL CHANGES.
yarn remove husky
# Or if you use npm
npm un husky
# Then deploy and scale.
now
now scale <IveBot deployment URL> 1
# Then bring back husky.
git clean -df
git checkout -- .
yarn
# If you use npm.
npm i
# The IveBot alias is already taken! No option there.
```
