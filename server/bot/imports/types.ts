// Flow our types.
/* eslint-disable no-undef */
import { CommandGenerator } from 'eris'
import IveBotCommandClient, { IveBotCommandOptions } from './CustomClient'
import { Db } from 'mongodb'

// eslint-disable-next-line no-use-before-define
export type IveBotCommand = (client: IveBotCommandClient, db?: DB, mongoDB?: Db) => {
  generator: CommandGenerator,
  opts: IveBotCommandOptions,
  name: string
}

export type FalseUser = { id: string, username: string, discriminator: string }
export type DB = {
  gunfight: Array<{
    challenged: string,
    challenger: string,
    accepted: boolean,
    randomWord: string,
    channelID: string
  }>,
  say: {
    // Channels.
    [index: string]: string
  },
  link: {
    [index: string]: string
  },
  leave: Array<string>
}
/* eslint-enable no-undef */
