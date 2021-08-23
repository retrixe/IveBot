// Flow our types.
import { AdvancedMessageContent, Client, Message } from 'eris'
import CommandParser from '../client.js'
import { Db } from 'mongodb'
import { TriviaSession } from '../commands/trivia.js'
import { ApplicationCommandOption, CommandContext } from 'slash-create'

export interface DB {
  gunfight: {
    [key: string]: {
      randomWord: string
      timestamp: number
      channelID: string
      accepted: boolean
      wordSaid: boolean
    }
  }
  say: {
    // Channels.
    [index: string]: string
  }
  trivia: {
    [index: string]: TriviaSession
  }
  mute: {
    // Servers with userIDs contained.
    [index: string]: string[]
  }
  cooldowns: { request: Set<string> }
  leave: Set<string>
}

export interface Context { tempDB: DB, db: Db, commandParser: CommandParser, client: Client }
export type CommandResponse = string | AdvancedMessageContent & { error?: boolean }
export type IveBotCommandGeneratorFunction = (msg: Message, args: string[], ctx: Context) =>
void | Promise<void> | CommandResponse | Promise<CommandResponse>
export type IveBotSlashGeneratorFunction = (context: CommandContext, ctx: Context) =>
void | Promise<void> | CommandResponse | Promise<CommandResponse>
export type IveBotCommandGenerator = IveBotCommandGeneratorFunction|string|AdvancedMessageContent
export interface Command {
  opts: CommandOptions
  aliases?: string[]
  name: string
  generator: IveBotCommandGenerator
  postGenerator?: (message: Message, args: string[], sent?: Message, ctx?: Context) => void
  slashGenerator?: true | IveBotSlashGeneratorFunction
  commonGenerator?: (...args: any[]) => CommandResponse | Promise<CommandResponse>
}
export interface CommandOptions {
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
    userIDs?: string[]
    roleNames?: string[]
    custom?: (message: Message) => boolean
    permissions?: { [permission: string]: boolean }
    roleIDs?: string[]
  }
  slashOptions?: ApplicationCommandOption[]
}
