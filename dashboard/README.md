# IveBot dashboard

The dashboard component for IveBot. This contains a configuration panel for users to configure IveBot's various features from the web.

## Configuration

Starting the dashboard itself is identical to IveBot itself i.e. via `yarn build` and `yarn start`, except you must run these in this `dashboard` folder. You must create a file `config.json` in the `dashboard` folder like so:

```json
{
  "clientId": "<insert Discord client ID here>",
  "clientSecret": "<insert Discord client secret here>",
  "jwtSecret": "<randomised token to sign JWT and talk with IveBot, the longer the better>",
  "mongoUrl": "<the link to your MongoDB database instance>",
  "host": "<your user ID to give you certain privileges like /remoteexec>",
  "rootUrl": "<the root link to the dashboard with http(s):// and no / at the end>"
}
```

Once done, you should be able to run the dashboard without any issues. The dashboard also supports `dotenv` for `MONGO_URL` like IveBot does. To specify a custom port, start the dashboard with `yarn start -p 80` (replace 80 with any port of your choice).
