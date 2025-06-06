import type {
  AdvancedMessageContent,
  Client,
  CommandInteraction,
  ApplicationCommandOptions,
  Message,
} from '@projectdysnomia/dysnomia'
import type CommandParser from '../client.ts'
import type { Db, ObjectId } from 'mongodb'
import type { TriviaSession } from '../commands/games/trivia.ts'

export interface Gunfight {
  randomWord: string
  timestamp: number
  channelID: string
  accepted: boolean
  wordSaid: boolean
}

export interface DB {
  gunfight: Map<string, Gunfight>
  say: Map<string, string> // Channels.
  trivia: Map<string, TriviaSession>
  mute: Set<string> // Server + userID
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
) => undefined | CommandResponse | Promise<CommandResponse | undefined>

export type IveBotSlashGeneratorFunction<T extends Record<string, unknown>> = (
  interaction: CommandInteraction,
  options: T,
  ctx: Context,
) => undefined | CommandResponse | Promise<CommandResponse | undefined>

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
}

export interface SlashCommand<T extends Record<string, unknown> = Record<string, never>>
  extends Command {
  slashGenerator?: true | IveBotSlashGeneratorFunction<T>
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

// MongoDB entities
export interface CommandAnalytics {
  name: string
  totalUse: number
  averageExecTime: number[]
}

export interface BaseTask {
  _id: ObjectId
  time: number
  type: string
}

export interface ReminderTask extends BaseTask {
  type: 'reminder'
  target: string
  message: string
}

export interface UnmuteTask extends BaseTask {
  type: 'unmute'
  guild: string
  user: string
  target: string
}

export type Task = ReminderTask | UnmuteTask

export interface ServerSettings {
  publicRoles?: string
  joinAutorole?: string
  ocrOnSend?: boolean
  joinLeaveMessages?: {
    channel?: string
    banMessage?: string
    joinMessage?: string
    leaveMessage?: string
  }
}

export interface Warning {
  _id: ObjectId
  serverId: string
  warnedId: string
  warnerId: string
  reason: string
  date: Date
}
