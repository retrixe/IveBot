import json5 from 'json5'
import { readFile } from 'fs/promises'

interface Config {
  token: string
  mongoUrl: string
  host: string
  testPilots: string[]
  dashboardUrl: string
  jwtSecret: string

  nasaApiKey: string
  oxfordApi: { appKey: string; appId: string }
  weatherApiKey: string
  fixerApiKey: string
  gcloudApiKey: string
  openaiApiKey: string
}

const config = json5.parse(await readFile('config.json5', { encoding: 'utf8' })) as Config

export const {
  token,
  mongoUrl,
  host,
  testPilots,
  dashboardUrl,
  jwtSecret,
  nasaApiKey,
  oxfordApi,
  weatherApiKey,
  fixerApiKey,
  gcloudApiKey,
  openaiApiKey,
} = config

export default config
