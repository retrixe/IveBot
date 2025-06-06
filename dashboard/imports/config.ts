import config from '../config.json'

export const { botApiUrl, botToken, clientId, clientSecret, jwtSecret, mongoUrl, host, rootUrl } =
  config

export default config as {
  botApiUrl: string
  botToken: string
  clientId: string
  clientSecret: string
  jwtSecret: string
  mongoUrl: string
  host: string
  rootUrl?: string
}
