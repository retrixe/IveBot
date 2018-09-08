// Flow our types.
/* eslint-disable no-undef */
import { Client, Message, MessageContent, CommandGeneratorFunction } from 'eris'
import CommandParser from '../client'
import { Db } from 'mongodb'

export type IveBotCommandGenerator = MessageContent|CommandGeneratorFunction|MessageContent[]
export type Command = {
  // eslint-disable-next-line no-use-before-define
  opts: CommandOptions,
  aliases?: string[],
  name: string,
  generator: (
    client: Client, db?: DB, mongoDB?: Db, commandParser?: CommandParser
  ) => IveBotCommandGenerator,
  postGenerator?: (client: Client, db?: DB, mongoDB?: Db) => (
    message: Message, args: string[], sent?: Message
  ) => void
}
export type CommandOptions = {
  argsRequired?: boolean
  caseInsensitive?: boolean
  deleteCommand?: boolean
  errorMessage?: string
  invalidUsageMessage?: string
  guildOnly?: boolean
  dmOnly?: boolean
  description: string
  fullDescription: string
  usage: string
  example: string
  hidden?: boolean
  requirements?: {
    userIDs?: string[],
    roleNames?: string[],
    custom?: (message: Message) => boolean,
    permissions?: {},
    roleIDs?: string[]
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
