// Flow our types.
import { AdvancedMessageContent, Client, Message } from 'eris'
import CommandParser from '../client'
import { Db } from 'mongodb'
import { TriviaSession } from '../commands/trivia'

export type DB = {
  gunfight: {
    [key: string]: {
      randomWord: string,
      timestamp: number,
      channelID: string,
      accepted: boolean,
      wordSaid: boolean
    }
  },
  say: {
    // Channels.
    [index: string]: string
  },
  trivia: {
    [index: string]: TriviaSession
  },
  mute: {
    // Servers with userIDs contained.
    [index: string]: string[]
  },
  link: {
    [index: string]: string
  },
  cooldowns: { request: string[] },
  leave: Array<string>
}

export type Context = { tempDB: DB, db: Db, commandParser: CommandParser, client: Client }
export type CommandResponse = string | AdvancedMessageContent & { error?: boolean }
export type IveBotCommandGeneratorFunction = (msg: Message, args: string[], ctx: Context) =>
  void | Promise<void> | CommandResponse | Promise<CommandResponse>
export type IveBotCommandGenerator = IveBotCommandGeneratorFunction|string|AdvancedMessageContent
export type Command = {
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
