// Flow our types.
/* eslint-disable no-undef */
import { CommandGenerator, Client, Message } from 'eris'
import IveBotCommandClient, { IveBotCommandOptions } from './CustomClient'
import { Db } from 'mongodb'

// eslint-disable-next-line no-use-before-define
export type IveBotCommand = (client: IveBotCommandClient, db?: DB, mongoDB?: Db) => {
  generator: CommandGenerator,
  opts: IveBotCommandOptions,
  name: string
}
export type Command = {
  // eslint-disable-next-line no-use-before-define
  opts: CommandOptions,
  aliases: string[],
  name: string,
  generators: (client: Client, db?: DB, mongoDB?: Db) => ({
    generator: string|Function // CommandGenerator,
    postGenerator: (message: Message, args: string[], sent?: Message) => void
  })
}
export type CommandOptions = {
  argsRequired: boolean
  caseInsensitive: boolean
  deleteCommand: boolean
  guildOnly: boolean
  dmOnly: boolean
  description: string
  fullDescription: string
  usage: string
  example: string
  hidden: boolean
  requirements: {
    userIDs: string[], roleNames: string[], custom: Function, permissions: {}, roleIDs: string[]
  }
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
