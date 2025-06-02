import json5 from 'json5'
import { readFile } from 'fs/promises'

interface Config {
  weatherAPIkey: string
  openaiAPIkey: string
  fixerAPIkey: string
  cvAPIkey: string
  host: string
  NASAtoken: string
  oxfordAPI: { appKey: string; appId: string }
  testPilots: string[]
  jwtSecret: string
  mongoURL: string
  rootURL: string
  token: string
}

const config: Config = json5.parse(await readFile('config.json5', { encoding: 'utf8' }))

export const {
  weatherAPIkey,
  openaiAPIkey,
  fixerAPIkey,
  cvAPIkey,
  host,
  NASAtoken,
  oxfordAPI,
  testPilots,
  jwtSecret,
  mongoURL,
  rootURL,
  token,
} = config

export default config
