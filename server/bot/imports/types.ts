// Flow our types.
/* eslint-disable no-undef */
import { Client, Message, MessageContent, EmbedOptions } from 'eris'
import CommandParser from '../client'
import { Db } from 'mongodb'

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
  mute: {
    // Servers with userIDs contained.
    [index: string]: string[]
  },
  link: {
    [index: string]: string
  },
  leave: Array<string>
}

export type Context = { tempDB: DB, db: Db, commandParser: CommandParser, client: Client }
export type IveBotCommandGeneratorFunction = (msg: Message, args: string[], ctx: Context) => string | void | {
    content?: string;
    tts?: boolean;
    disableEveryone?: boolean;
    embed?: EmbedOptions;
} | Promise<MessageContent> | Promise<void>
export type IveBotCommandGenerator = IveBotCommandGeneratorFunction|MessageContent
export type Command = {
  // eslint-disable-next-line no-use-before-define
  opts: CommandOptions,
  aliases?: string[],
  name: string,
  generator: IveBotCommandGenerator,
  postGenerator?: (message: Message, args: string[], sent?: Message, ctx?: Context) => void
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
/* eslint-enable no-undef */
