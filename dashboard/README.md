# IveBot dashboard

The dashboard component for IveBot. This contains a configuration panel for users to configure IveBot's various features from the web.

## Configuration

Starting the dashboard itself is identical to IveBot itself i.e. via `yarn build` and `yarn start`, except you must run these in the `dashboard` folder. You must also get the dependencies in the parent IveBot folder, as these are shared between the two.

The dashboard relies on a private HTTP API IveBot provides. Without this API, it falls back to using `botToken` and hits rate limits, slowing down the real bot as well as the dashboard *hugely*. You must ensure IveBot has access to the internet and is able to port forward `7331` (configurable using `IVEBOT_API_PORT` environment variable when running IveBot). You must also put the same JWT secret the dashboard uses in IveBot's `config.json5` for secured communication. You must create a file `config.json` in the `dashboard` folder like so:

```json
{
  "botApiUrl": "<insert URL to IveBot here with http(s)://<hostname>:<port> and no / at the end>",
  "botToken": "<insert Discord bot token here>",
  "clientId": "<insert Discord client ID here>",
  "clientSecret": "<insert Discord client secret here>",
  "jwtSecret": "<randomised token to sign JWTs and talk with IveBot, the longer the better>",
  "mongoUrl": "<the link to your MongoDB database instance>",
  "host": "<your user ID to give you certain privileges like /remoteexec>",
  "rootUrl": "<the root link to the dashboard with http(s):// and no / at the end>"
}
```

Once done, you should be able to run the dashboard without any issues. The dashboard also supports `dotenv` for `MONGO_URL` like IveBot does. To specify a custom port, start the dashboard with `yarn start -p 80` (replace 80 with any port of your choice).
