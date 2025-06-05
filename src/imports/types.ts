import type {
  AdvancedMessageContent,
  Client,
  CommandInteraction,
  ApplicationCommandOptions,
  Message,
} from '@projectdysnomia/dysnomia'
import type CommandParser from '../client.ts'
import type { Db } from 'mongodb'
import type { TriviaSession } from '../commands/games/trivia.ts'

export interface Gunfight {
  randomWord: string
  timestamp: number
  channelID: string
  accepted: boolean
  wordSaid: boolean
}

export interface DB {
  gunfight: Record<string, Gunfight>
  say: Record<string, string> // Channels.
  trivia: Record<string, TriviaSession>
  mute: Record<string, string[]> // Servers with userIDs contained.
  cooldowns: { request: Set<string> }
  leave: Set<string>
}

export interface Context {
  tempDB: DB
  db: Db
  commandParser: CommandParser
  client: Client
}

export type CommandResponse = string | (AdvancedMessageContent & { error?: boolean })

export type IveBotCommandGeneratorFunction = (
  msg: Message,
  args: string[],
  ctx: Context,
) => undefined | Promise<undefined> | CommandResponse | Promise<CommandResponse>

export type IveBotSlashGeneratorFunction = (
  interaction: CommandInteraction,
  ctx: Context,
) => undefined | Promise<undefined> | CommandResponse | Promise<CommandResponse>

export type IveBotCommandGenerator =
  | IveBotCommandGeneratorFunction
  | string
  | AdvancedMessageContent

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
  options?: ApplicationCommandOptions[]
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
    permissions?: Record<string, boolean>
    roleIDs?: string[]
  }
}
