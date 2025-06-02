import type {
  Message,
  MessageContent,
  Client,
  GuildTextableChannel,
} from '@projectdysnomia/dysnomia'
import type {
  DB,
  Command as IveBotCommand,
  IveBotCommandGenerator,
  Context,
  CommandResponse,
} from './imports/types.ts'
import type { Db } from 'mongodb'
import { getInsult } from './imports/tools.ts'
import botCallback from './events.ts'

function isEquivalent(a: Record<string, boolean>, b: Record<string, boolean>): boolean {
  // Create arrays of property names
  const aProps = Object.getOwnPropertyNames(a)
  const bProps = Object.getOwnPropertyNames(b)

  // If number of properties is different, objects are not equivalent
  if (aProps.length !== bProps.length) return false

  for (const propName of aProps) {
    // If values of same property are not equal, objects are not equivalent
    if (a[propName] !== b[propName]) return false
  }

  // If we made it this far, objects are considered equivalent
  return true
}

export class Command {
  name: string
  aliases?: string[]
  generator: IveBotCommandGenerator
  postGenerator?: (message: Message, args: string[], sent?: Message, ctx?: Context) => void
  argsRequired: boolean
  caseInsensitive: boolean
  deleteCommand: boolean
  guildOnly: boolean
  dmOnly: boolean
  description: string
  fullDescription: string
  usage: string
  example: string
  invalidUsageMessage: string
  errorMessage: string
  hidden: boolean
  requirements?: {
    userIDs?: string[]
    roleNames?: string[]
    custom?: (message: Message) => boolean
    permissions?: Record<string, boolean>
    roleIDs?: string[]
  }

  constructor(command: IveBotCommand) {
    // Key functions.
    this.name = command.name
    this.aliases = command.aliases
    this.generator = command.generator
    this.postGenerator = command.postGenerator
    // Options.
    this.argsRequired = command.opts.argsRequired === undefined || command.opts.argsRequired
    const defaultUsageMessage = 'Invalid usage, correct usage: ' + command.opts.usage
    this.invalidUsageMessage = command.opts.invalidUsageMessage || defaultUsageMessage
    this.errorMessage = command.opts.errorMessage || 'IveBot has experienced an internal error.'
    // No impl for next.
    this.caseInsensitive =
      command.opts.caseInsensitive === undefined || command.opts.caseInsensitive
    this.deleteCommand = command.opts.deleteCommand || false
    this.guildOnly = command.opts.guildOnly || false
    this.dmOnly = command.opts.dmOnly || false
    // For help.
    this.description = command.opts.description
    this.fullDescription = command.opts.fullDescription
    this.usage = command.opts.usage
    this.example = command.opts.example
    this.hidden = command.opts.hidden || false // Unimplemented in help.
    // Requirements.
    this.requirements = command.opts.requirements
    // No cooldown implementation.
    // No reaction implementation.
  }

  requirementsCheck(message: Message): boolean {
    if (!this.requirements) return true
    // No role name or ID impl.
    const userIDs = this.requirements.userIDs // If it doesn't exist it's a pass.
      ? this.requirements.userIDs.includes(message.author.id)
      : false // Next line calls custom if it exists.
    const custom = this.requirements.custom ? this.requirements.custom(message) : false
    // If it's not a guild there are no permissions.
    if (message.channel.type !== 0) return userIDs || custom
    const permissions = this.requirements.permissions && message.member
      ? isEquivalent(Object.assign( // Assign the required permissions onto the member's permission.
        message.member.permissions.json, this.requirements.permissions
      ), message.member.permissions.json) // This should eval true if user has permissions.
      : false
    // If any of these are true, it's a go.
    return userIDs || custom || permissions
  }

  async execute (context: Context, message: Message, args: string[]): Promise<CommandResponse | undefined> {
    // Define 2 vars.
    let messageToSend: CommandResponse | undefined | Promise<CommandResponse> | Promise<undefined>
    // If it's a function, we call it first.
    if (typeof this.generator === 'function') messageToSend = this.generator(message, args, context)
    else messageToSend = this.generator
    // We don't process Promises because we unconditionally return a Promise.
    // Async functions returning arrays aren't supported.
    return await messageToSend
  }
}

export default class CommandParser {
  commands: Record<string, Command>
  client: Client
  tempDB: DB
  db: Db
  evaluatedMessages: string[]
  analytics: Record<string, { totalUse: number; averageExecTime: number[] }>

  constructor(client: Client, tempDB: DB, db: Db) {
    this.commands = {}
    this.client = client
    this.tempDB = tempDB
    this.db = db
    this.analytics = {}
    this.evaluatedMessages = []
    this.onMessage = this.onMessage.bind(this)
    this.onMessageUpdate = this.onMessageUpdate.bind(this)
    setInterval(() => {
      this.sendAnalytics().catch(console.error)
    }, 30000)
  }

  registerCommand = (command: IveBotCommand): void => {
    this.commands[command.name] = new Command(command)
  }

  async executeCommand(command: Command, message: Message): Promise<boolean> {
    // We give our generators what they need.
    const context: Context = {
      tempDB: this.tempDB,
      db: this.db,
      commandParser: this,
      client: this.client,
    }
    const args = message.content
      .trim()
      .split(' ')
      .filter(i => i)
      .slice(1)
    // Guild and DM only.
    if (command.guildOnly && message.channel.type !== 0) return false
    else if (command.dmOnly && message.channel.type !== 1) return false
    // Check for permissions.
    else if (!command.requirementsCheck(message)) {
      await message.channel.createMessage(
        `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`,
      )
      return false
      // We check for arguments.
    } else if (args.length === 0 && command.argsRequired) {
      await message.channel.createMessage(command.invalidUsageMessage)
      return true
    }
    // Delete the message if needed.
    try {
      if (command.deleteCommand) await message.delete('Automatically deleted by IveBot.')
    } catch (e) {}
    // We get the exact content to send.
    const messageToSend = await command.execute(context, message, args)
    // We define a sent variable to keep track.
    let sent
    if ( // No permission protection is here as well.
      messageToSend && ((message.member &&
      (message.channel as GuildTextableChannel)
        .permissionsOf(this.client.user.id).has('sendMessages')) || // Channel can be a partial now.
        message.channel.type === 1 || message.channel.type === 3 || !message.channel.type)
    ) sent = await this.client.createMessage(message.channel.id, this.disableEveryone(messageToSend))
    if (command.postGenerator) command.postGenerator(message, args, sent, context)
    return typeof messageToSend === 'object' ? messageToSend.error || false : false
  }

  disableEveryone = (message: MessageContent<'hasNonce'>): MessageContent<'hasNonce'> => {
    if (typeof message !== 'string' && !message.allowedMentions) {
      message.allowedMentions = { everyone: false, roles: false, users: true }
      return message
    } else if (typeof message === 'string') {
      return { content: message, allowedMentions: { everyone: false, roles: false, users: true } }
    } else return message
  }

  saveAnalytics(timeTaken: [number, number], name: string): void {
    // Get the local command info.
    let commandInfo = this.analytics[name]
    // If there is no info for the command then insert an object for it.
    if (!commandInfo) {
      this.analytics[name] = { averageExecTime: [0, 0], totalUse: 0 }
      commandInfo = this.analytics[name]
    }
    // Calculate the average time of execution taken.
    const averageExecTime = commandInfo.averageExecTime.map((i: number, index: number) => (
      ((i * commandInfo.totalUse) + timeTaken[index]) / (commandInfo.totalUse + 1)
    ))
    // Update local cache with analytics.
    this.analytics[name].totalUse += 1
    this.analytics[name].averageExecTime = averageExecTime
  }

  async sendAnalytics(): Promise<void> {
    const analytics = this.db.collection('analytics')
    // Iterate over every command we have information stored locally.
    for (const commandName in this.analytics) {
      const command = this.analytics[commandName]
      // Get the data for the selected command.
      const statistics = await analytics.findOne({ name: commandName })
      // If the command was not stored, we store our analytics directly.
      if (!statistics) await analytics.insertOne({ name: commandName, ...command })
      // Else, we update existing command data in the database.
      else {
        // Calculate the average execution time and update the database.
        const averageExecTime = statistics.averageExecTime.map((i: number, index: number) => (
          (
            (i * statistics.totalUse) + (command.averageExecTime[index] * command.totalUse)
          ) / (statistics.totalUse as number + command.totalUse)
        ))
        await analytics.updateOne({ name: commandName }, {
          $inc: { totalUse: command.totalUse },
          $set: { averageExecTime }
        })
      }
      // Clear analytics for the command.
      command.totalUse = 0
      command.averageExecTime = [0, 0]
    }
  }

  async onMessage(message: Message): Promise<void> {
    if (message.content && !message.content.startsWith('/')) {
      await botCallback(message, this.client, this.tempDB, this.db)
      return // Don't process it if it's not a command.
    }
    const commandExec = message.content.split(' ')[0].substr(1).toLowerCase()
    // Webhook and bot protection.
    try {
      if (message.author.bot) return
    } catch (e) {
      return
    }
    // Check for the command in this.commands.
    const keys = Object.keys(this.commands)
    for (const key of keys) {
      if (commandExec === key.toLowerCase() || this.commands[key].aliases?.includes(commandExec)) {
        // Execute command.
        try {
          const executeFirst = process.hrtime() // Initial high-precision time.
          const error = await this.executeCommand(this.commands[key], message)
          const executeSecond = process.hrtime(executeFirst) // Time difference.
          this.saveAnalytics(executeSecond, key) // Send analytics.
          // We mark the command as evaluated and schedule a removal of the ID in 30 seconds.
          if (!error) {
            this.evaluatedMessages.push(message.id)
            setTimeout(() => {
              this.evaluatedMessages.splice(this.evaluatedMessages.findIndex(i => i === message.id), 1)
            }, 30000)
          } // TODO: else add it to erroredMessage, and edit that message on re-eval.
        } catch (e) {
          // On error, we tell the user of an unknown error and log it for our reference.
          await message.channel.createMessage(this.commands[key].errorMessage)
          console.error(e)
        }
        return
      }
    }
    await botCallback(message, this.client, this.tempDB, this.db)
  }

  // For evaluating messages which weren't evaluated.
  async onMessageUpdate(message: Message, oldMessage?: Message): Promise<void> {
    // We won't bother with a lot of messages..
    if (message.content && !message.content.startsWith('/')) return
    else if (!message.editedTimestamp) return
    else if (this.evaluatedMessages.includes(message.id)) return
    else if (Date.now() - message.timestamp > 30000) return
    else if (message.editedTimestamp - message.timestamp > 30000) return
    // Proceed to evaluate.
    const commandExec = message.content.split(' ')[0].substr(1).toLowerCase()
    // Webhook and bot protection.
    try {
      if (message.author.bot) return
    } catch (e) {
      return
    }
    // Check for the command in this.commands.
    const keys = Object.keys(this.commands)
    for (const key of keys) {
      if (commandExec === key.toLowerCase() || this.commands[key].aliases?.includes(commandExec)) {
        // Execute command.
        try {
          const executeFirst = process.hrtime() // Initial high precision time.
          const error = await this.executeCommand(this.commands[key], message)
          const executeSecond = process.hrtime(executeFirst) // Time difference.
          this.saveAnalytics(executeSecond, key) // Send analytics.
          if (!error) {
            // We mark the command as evaluated and schedule a removal of the ID in 30 seconds.
            this.evaluatedMessages.push(message.id)
            setTimeout(() => {
              this.evaluatedMessages.splice(this.evaluatedMessages.findIndex(i => i === message.id), 1)
            }, 30000)
          }
        } catch (e) {
          // On error, we tell the user of an unknown error and log it for our reference.
          await message.channel.createMessage(this.commands[key].errorMessage)
          console.error(e)
        }
        return
      }
    }
  }
}
