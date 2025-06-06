import type Dysnomia from '@projectdysnomia/dysnomia'
import { Constants } from '@projectdysnomia/dysnomia'
import type {
  Message,
  MessageContent,
  AdvancedMessageContent,
  Client,
  CommandInteraction,
  ApplicationCommand,
  ApplicationCommandOptions,
} from '@projectdysnomia/dysnomia'
import type {
  DB,
  SlashCommand as IveBotSlashCommand,
  IveBotCommandGenerator,
  Context,
  CommandResponse,
  IveBotSlashGeneratorFunction,
  CommandAnalytics,
} from './imports/types.ts'
import { getInsult, isEquivalent } from './imports/tools.ts'
import type CommandParser from './client.ts'
import type { Db } from 'mongodb'

export class SlashCommand<T extends Record<string, unknown> = Record<string, unknown>> {
  name: string
  aliases?: string[]
  options: ApplicationCommandOptions[]
  generator: IveBotCommandGenerator
  slashGenerator?: true | IveBotSlashGeneratorFunction<T>
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
    permissions?: Record<keyof Constants['Permissions'], boolean>
    roleIDs?: string[]
  }

  constructor(command: IveBotSlashCommand<T>) {
    // Key functions.
    this.name = command.name
    this.aliases = command.aliases
    this.generator = command.generator
    this.postGenerator = command.postGenerator
    this.slashGenerator = command.slashGenerator
    // Options.
    this.options = command.opts.options || []
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

  async register(client: Client): Promise<ApplicationCommand> {
    return await client.createCommand({
      type: Constants.ApplicationCommandTypes.CHAT_INPUT,
      name: this.name,
      description: this.description.replace(/</g, '').replace(/>/g, ''),
      defaultPermission: true,
      options: this.options,
    })
  }

  requirementsCheck(interaction: CommandInteraction): boolean {
    if (!this.requirements) return true
    // No role name or ID impl.
    const userIDs = this.requirements.userIDs // If it doesn't exist it's a pass.
      ? this.requirements.userIDs.includes(interaction.user.id)
      : false // Next line calls custom if it exists.
    // TODO
    if (this.requirements.custom) {
      throw new Error('Custom requirements are not implemented yet!')
    }
    // const custom = this.requirements.custom ? this.requirements.custom(interaction) : false
    // If it's not a guild there are no permissions.
    if (!interaction.guild) return userIDs // || custom
    const permissions =
      this.requirements.permissions && interaction.member
        ? isEquivalent(
            // Assign the required permissions onto the member's permission.
            Object.assign(interaction.member.permissions.json, this.requirements.permissions),
            interaction.member.permissions.json,
          ) // This should eval true if user has permissions.
        : false
    // If any of these are true, it's a go.
    return userIDs /* || custom */ || permissions
  }

  async execute(
    context: Context,
    interaction: CommandInteraction,
  ): Promise<CommandResponse | undefined> {
    const generator =
      this.slashGenerator === true || typeof this.generator !== 'function'
        ? (this.generator as () => CommandResponse)
        : this.slashGenerator
    const options =
      interaction.data.options?.reduce<Record<string, unknown>>((acc, option) => {
        if (
          option.type === Constants.ApplicationCommandOptionTypes.STRING ||
          option.type === Constants.ApplicationCommandOptionTypes.MENTIONABLE ||
          option.type === Constants.ApplicationCommandOptionTypes.USER ||
          option.type === Constants.ApplicationCommandOptionTypes.ROLE ||
          option.type === Constants.ApplicationCommandOptionTypes.CHANNEL ||
          option.type === Constants.ApplicationCommandOptionTypes.INTEGER ||
          option.type === Constants.ApplicationCommandOptionTypes.NUMBER ||
          option.type === Constants.ApplicationCommandOptionTypes.BOOLEAN
        ) {
          acc[option.name] = option.value
        }
        return acc
      }, {}) ?? {}
    const messageToSend =
      typeof generator === 'function' ? generator(interaction, options as T, context) : generator
    return await messageToSend
  }
}

export default class SlashParser {
  commands: Record<string, SlashCommand>
  commandParser: CommandParser
  client: Client
  tempDB: DB
  db: Db
  analytics: Record<string, Omit<CommandAnalytics, 'name'>>

  constructor(client: Client, tempDB: DB, db: Db, commandParser: CommandParser) {
    this.commands = {}
    this.commandParser = commandParser
    this.client = client
    this.tempDB = tempDB
    this.db = db
    this.analytics = {}
    this.handleCommandInteraction = this.handleCommandInteraction.bind(this)
    setInterval(() => {
      this.sendAnalytics().catch(console.error)
    }, 30000)
  }

  registerCommand = (command: IveBotSlashCommand<Record<string, unknown>>): void => {
    this.commands[command.name] = new SlashCommand(command)
  }

  async executeCommand(command: SlashCommand, interaction: CommandInteraction): Promise<void> {
    // Guild and DM only.
    if (command.guildOnly && !interaction.guild) {
      await interaction.createMessage({
        content: 'This command can only be executed from a Discord guild.',
        flags: Constants.MessageFlags.EPHEMERAL,
      })
      return
    } else if (command.dmOnly && interaction.guild) {
      await interaction.createMessage({
        content: 'This command can only be executed in direct messages.',
        flags: Constants.MessageFlags.EPHEMERAL,
      })
      return
      // Check for permissions.
    } else if (!command.requirementsCheck(interaction)) {
      await interaction.createMessage(
        // Publicly shaming them for missing permissions, ofc.
        `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`,
      )
      return
    }
    // Validate that the arguments match schema to prevent further errors down the line.
    const found: string[] = []
    for (const option of interaction.data.options ?? []) {
      found.push(option.name)
      const optionInfo = command.options.find(arg => arg.name === option.name)
      if (!optionInfo) {
        throw new Error(`Discord did not correctly validate interaction! (${command.name})`)
      } else if (
        (optionInfo.type === Constants.ApplicationCommandOptionTypes.STRING ||
          optionInfo.type === Constants.ApplicationCommandOptionTypes.MENTIONABLE ||
          optionInfo.type === Constants.ApplicationCommandOptionTypes.USER ||
          optionInfo.type === Constants.ApplicationCommandOptionTypes.ROLE ||
          optionInfo.type === Constants.ApplicationCommandOptionTypes.CHANNEL) &&
        typeof (option as Dysnomia.InteractionDataOptionsString).value !== 'string'
      ) {
        throw new Error(`Discord did not correctly validate interaction! (${command.name})`)
      } else if (
        (optionInfo.type === Constants.ApplicationCommandOptionTypes.INTEGER ||
          optionInfo.type === Constants.ApplicationCommandOptionTypes.NUMBER) &&
        typeof (option as Dysnomia.InteractionDataOptionsNumber).value !== 'number'
      ) {
        throw new Error(`Discord did not correctly validate interaction! (${command.name})`)
      } else if (
        optionInfo.type === Constants.ApplicationCommandOptionTypes.BOOLEAN &&
        typeof (option as Dysnomia.InteractionDataOptionsBoolean).value !== 'boolean'
      ) {
        throw new Error(`Discord did not correctly validate interaction! (${command.name})`)
      } // No sub command validation, write when you add sub commands.
    }
    const requiredOptions = command.options.filter(opt => opt.required)
    if (!requiredOptions.every(option => found.includes(option.name))) {
      throw new Error(`Discord did not correctly validate interaction! (${command.name})`)
    }
    // We give our generators what they need.
    const context: Context = {
      tempDB: this.tempDB,
      db: this.db,
      commandParser: this.commandParser,
      client: this.client,
    }
    // We get the exact content to send.
    const messageToSend = await command.execute(context, interaction)
    // We define a sent variable to keep track.
    if (messageToSend) {
      await interaction.createMessage({
        ...this.disableEveryone(messageToSend),
        flags:
          (typeof messageToSend === 'object' && messageToSend.error) || command.deleteCommand
            ? Constants.MessageFlags.EPHEMERAL
            : 0,
      })
    }
    // TODO: if (command.postGenerator) command.postGenerator(message, args, sent, context)
  }

  disableEveryone = (message: MessageContent): AdvancedMessageContent => {
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
    const averageExecTime = commandInfo.averageExecTime.map(
      (i, index) => (i * commandInfo.totalUse + timeTaken[index]) / (commandInfo.totalUse + 1),
    )
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
      const statistics = await analytics.findOne<CommandAnalytics>({ name: commandName })
      // If the command was not stored, we store our analytics directly.
      if (!statistics) await analytics.insertOne({ name: commandName, ...command })
      // Else, we update existing command data in the database.
      else {
        // Calculate the average execution time and update the database.
        const averageExecTime = statistics.averageExecTime.map(
          (i: number, index: number) =>
            (i * statistics.totalUse + command.averageExecTime[index] * command.totalUse) /
            (statistics.totalUse + command.totalUse),
        )
        await analytics.updateOne(
          { name: commandName },
          { $inc: { totalUse: command.totalUse }, $set: { averageExecTime } },
        )
      }
      // Clear analytics for the command.
      command.totalUse = 0
      command.averageExecTime = [0, 0]
    }
  }

  async handleCommandInteraction(interaction: CommandInteraction): Promise<void> {
    if (!interaction.user) return

    const keys = Object.keys(this.commands)
    for (const key of keys) {
      if (
        interaction.data.name === key.toLowerCase() ||
        this.commands[key].aliases?.includes(interaction.data.name)
      ) {
        // Execute command.
        try {
          const executeFirst = process.hrtime() // Initial high-precision time.
          await this.executeCommand(this.commands[key], interaction)
          const executeSecond = process.hrtime(executeFirst) // Time difference.
          this.saveAnalytics(executeSecond, key) // Send analytics.
        } catch (e) {
          // On error, we tell the user of an unknown error and log it for our reference.
          await interaction.createMessage(this.commands[key].errorMessage)
          console.error(e)
        }
        return
      }
    }
  }

  async registerAllCommands(): Promise<ApplicationCommand[]> {
    return await Promise.all(
      Object.values(this.commands).map(async command => await command.register(this.client)),
    )
  }
}
