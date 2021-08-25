import { Message, MessageContent, AdvancedMessageContent, Client, CommandInteraction, Constants } from 'eris'
import { DB, Command, IveBotCommandGenerator, Context, CommandResponse, IveBotSlashGeneratorFunction } from './imports/types.js'
import { getInsult } from './imports/tools.js'
import CommandParser from './client.js'
import { Db } from 'mongodb'

function isEquivalent (a: { [index: string]: boolean }, b: { [index: string]: boolean }): boolean {
  // Create arrays of property names
  const aProps = Object.getOwnPropertyNames(a)
  const bProps = Object.getOwnPropertyNames(b)
  // If number of properties is different, objects are not equivalent
  if (aProps.length !== bProps.length) return false
  for (let i = 0; i < aProps.length; i++) {
    const propName = aProps[i]
    // If values of same property are not equal, objects are not equivalent
    if (a[propName] !== b[propName]) return false
  }
  // If we made it this far, objects are considered equivalent
  return true
}

export class SlashCommand {
  name: string
  aliases?: string[]
  generator: IveBotCommandGenerator
  slashGenerator: true | IveBotSlashGeneratorFunction
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
    permissions?: {}
    roleIDs?: string[]
  }

  constructor (command: Command) {
    // Key functions.
    this.name = command.name
    this.aliases = command.aliases
    this.generator = command.generator
    this.postGenerator = command.postGenerator
    this.slashGenerator = command.slashGenerator
    // Options.
    this.argsRequired = command.opts.argsRequired === undefined || command.opts.argsRequired
    const defaultUsageMessage = 'Invalid usage, correct usage: ' + command.opts.usage
    this.invalidUsageMessage = command.opts.invalidUsageMessage || defaultUsageMessage
    this.errorMessage = command.opts.errorMessage || 'IveBot has experienced an internal error.'
    // No impl for next.
    this.caseInsensitive = command.opts.caseInsensitive === undefined || command.opts.caseInsensitive
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

  // TODO: checkAndRegisterSelf

  requirementsCheck (interaction: CommandInteraction): boolean {
    if (!this.requirements) return true
    // No role name or ID impl.
    const userIDs = this.requirements.userIDs // If it doesn't exist it's a pass.
      ? this.requirements.userIDs.includes(interaction.user.id)
      : false // Next line calls custom if it exists.
    // TODO: const custom = this.requirements.custom ? this.requirements.custom(interaction) : false
    // If it's not a guild there are no permissions.
    if (!interaction.guildID) return userIDs // || custom
    const permissions = this.requirements.permissions && interaction.member
      ? isEquivalent(Object.assign( // Assign the required permissions onto the member's permission.
        interaction.member.permissions.json, this.requirements.permissions
      ), interaction.member.permissions.json) // This should eval true if user has permissions.
      : false
    // If any of these are true, it's a go.
    return userIDs /* || custom */ || permissions
  }

  async execute (context: Context, interaction: CommandInteraction): Promise<CommandResponse | void> {
    const generator = this.slashGenerator === true || typeof this.generator !== 'function'
      ? this.generator as () => CommandResponse
      : this.slashGenerator
    const messageToSend = typeof generator === 'function' ? generator(interaction, context) : generator
    return await messageToSend
  }
}

export default class SlashParser {
  commands: { [name: string]: SlashCommand }
  commandParser: CommandParser
  client: Client
  tempDB: DB
  db: Db
  evaluatedMessages: string[]
  analytics: { [name: string]: { totalUse: number, averageExecTime: number[] } }

  constructor (client: Client, tempDB: DB, db: Db, commandParser: CommandParser) {
    this.commands = {}
    this.commandParser = commandParser
    this.client = client
    this.tempDB = tempDB
    this.db = db
    this.analytics = {}
    this.handleCommandInteraction = this.handleCommandInteraction.bind(this)
    setInterval(() => { this.sendAnalytics().catch(console.error) }, 30000)
  }

  registerCommand = (command: Command): void => {
    this.commands[command.name] = new SlashCommand(command)
  }

  async executeCommand (command: SlashCommand, interaction: CommandInteraction): Promise<void> {
    // We give our generators what they need.
    const context: Context = {
      tempDB: this.tempDB, db: this.db, commandParser: this.commandParser, client: this.client
    }
    // Guild and DM only.
    if (command.guildOnly && !interaction.guildID) {
      await interaction.createMessage({
        content: 'This command can only be executed from a Discord guild.',
        flags: Constants.MessageFlags.EPHEMERAL
      })
      return
    } else if (command.dmOnly && interaction.guildID) {
      await interaction.createMessage({
        content: 'This command can only be executed in direct messages.',
        flags: Constants.MessageFlags.EPHEMERAL
      })
      return
      // Check for permissions.
    } else if (!command.requirementsCheck(interaction)) {
      await interaction.createMessage(
        `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
      )
      return
    }
    // Delete the message if needed.
    try {
      if (command.deleteCommand) await interaction.deleteOriginalMessage() // TODO: Just make it ephemeral?
    } catch (e) {}
    // We get the exact content to send.
    const messageToSend = await command.execute(context, interaction)
    // We define a sent variable to keep track.
    if (messageToSend) {
      await interaction.createMessage({
        ...this.disableEveryone(messageToSend),
        flags: typeof messageToSend === 'object' && messageToSend.error
          ? Constants.MessageFlags.EPHEMERAL
          : 0
      })
    }
    // TODO: if (command.postGenerator) command.postGenerator(message, args, sent, context)
  }

  disableEveryone = (message: MessageContent): AdvancedMessageContent => {
    if (typeof message !== 'string' && !message.allowedMentions) {
      message.allowedMentions = { everyone: false, roles: true, users: true }
      return message
    } else if (typeof message === 'string') {
      return { content: message, allowedMentions: { everyone: false, roles: true, users: true } }
    } else return message
  }

  saveAnalytics (timeTaken: [number, number], name: string): void {
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

  async sendAnalytics (): Promise<void> {
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

  async handleCommandInteraction (interaction: CommandInteraction): Promise<void> {
    if (!interaction.user) return

    const keys = Object.keys(this.commands)
    for (let i = 0; i < keys.length; i++) {
      if (interaction.data.name === keys[i].toLowerCase() ||
        this.commands[keys[i]].aliases?.includes(interaction.data.name)) {
        // Execute command.
        try {
          const executeFirst = process.hrtime() // Initial high-precision time.
          await this.executeCommand(this.commands[keys[i]], interaction)
          const executeSecond = process.hrtime(executeFirst) // Time difference.
          this.saveAnalytics(executeSecond, keys[i]) // Send analytics.
        } catch (e) {
          // On error, we tell the user of an unknown error and log it for our reference.
          await interaction.createMessage(this.commands[keys[i]].errorMessage)
          console.error(e)
        }
        return
      }
    }
  }
}
