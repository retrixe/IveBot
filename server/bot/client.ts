// eslint-disable-next-line standard/object-curly-even-spacing
import { Message, Client, MessageContent, CommandGeneratorFunction } from 'eris'
import { DB, Command as IveBotCommand, IveBotCommandGenerator } from './imports/types'
import { Db } from 'mongodb'
import { getInsult } from './imports/tools'

export class Command {
  name: string // eslint-disable-next-line no-undef
  aliases: string[] // eslint-disable-next-line no-undef
  generators: (client: Client, db?: DB, mongoDB?: Db) => ({ // eslint-disable-next-line no-undef
    generator: IveBotCommandGenerator,
    // eslint-disable-next-line no-undef
    postGenerator: (message: Message, args: string[], sent?: Message) => void
  })
  argsRequired: boolean // eslint-disable-line no-undef
  caseInsensitive: boolean // eslint-disable-line no-undef
  deleteCommand: boolean // eslint-disable-line no-undef
  guildOnly: boolean // eslint-disable-line no-undef
  dmOnly: boolean // eslint-disable-line no-undef
  description: string // eslint-disable-line no-undef
  fullDescription: string // eslint-disable-line no-undef
  usage: string // eslint-disable-line no-undef
  example: string // eslint-disable-line no-undef
  hidden: boolean // eslint-disable-line no-undef
  // eslint-disable-next-line no-undef
  requirements: { // eslint-disable-next-line no-undef
    userIDs: string[], roleNames: string[], custom: Function, permissions: {}, roleIDs: string[]
  }

  constructor (command: IveBotCommand) {
    // Key functions.
    this.name = command.name
    this.aliases = command.aliases
    this.generators = command.generators
    // Options.
    this.argsRequired = command.opts.argsRequired === undefined || command.opts.argsRequired
    // No impl for next.
    this.caseInsensitive = command.opts.caseInsensitive === undefined || command.opts.caseInsensitive
    this.deleteCommand = command.opts.deleteCommand
    this.guildOnly = command.opts.guildOnly
    this.dmOnly = command.opts.dmOnly
    // For help.
    this.description = command.opts.description
    this.fullDescription = command.opts.fullDescription
    this.usage = command.opts.usage
    this.example = command.opts.example
    this.hidden = command.opts.hidden // Unimplemented in help.
    // Requirements.
    this.requirements = command.opts.requirements
    // No cooldown implementation.
    // No reaction implementation.
  }
}

export class CommandParser {
  commands: { [name: string]: Command } // eslint-disable-line no-undef
  client: Client // eslint-disable-line no-undef
  tempDB: DB // eslint-disable-line no-undef
  db: Db // eslint-disable-line no-undef
  constructor (client: Client, tempDB: DB, db: Db) {
    this.commands = {}
    this.client = client
    this.tempDB = tempDB
    this.db = db
  }

  registerCommand = (command: IveBotCommand) => { // eslint-disable-line no-undef
    this.commands[command.name] = new Command(command)
  }

  requirementsCheck (command: Command, message: Message) {
    if (!command.requirements) return true
    // No role name or ID impl.
    const userIDs = command.requirements.userIDs // If it doesn't exist it's a pass.
      ? command.requirements.userIDs.includes(message.author.id)
      : true // Next line calls custom if it exists.
    const custom = command.requirements.custom ? command.requirements.custom() : true
    // If it's not a guild there are no permissions.
    if (message.channel.type !== 0) return userIDs || custom
    const permissions = command.requirements.permissions
      ? Object.assign( // Assign the required permissions onto the member's permission.
        message.member.permission.json, command.requirements.permissions
      ) === message.member.permission.json // This should eval true if user has permissions.
      : true
    // If any of these are true, it's a go.
    return userIDs || custom || permissions
  }

  async fixCommand (session: { // eslint-disable-next-line indent
    generator: IveBotCommandGenerator, // eslint-disable-next-line indent
    postGenerator: (message: Message, args: string[], sent?: Message) => void
  }, message: Message, args: string[]) {
    // Define 2 vars.
    let messageToSend: MessageContent|void|Promise<MessageContent>|Promise<void>
    let toProcess: MessageContent|void|Promise<MessageContent>|Promise<void>|MessageContent[]
    |CommandGeneratorFunction
    // If it's a function, we call it first.
    if (typeof session.generator === 'function') toProcess = session.generator(message, args)
    else toProcess = session.generator
    // If it's an array, we need a random response.
    if (toProcess instanceof Array) messageToSend = toProcess[Math.floor(Math.random() * toProcess.length)]
    else messageToSend = toProcess
    // We don't process Promises because we unconditionally return a Promise.
    // Async functions returning arrays aren't supported.
    return messageToSend
  }

  async executeCommand (command: Command, message: Message) {
    // We give our generators what they need.
    const session = command.generators(this.client, this.tempDB, this.db)
    const args = message.content.split(' ')
    args.shift()
    // We check for requirements and arguments.
    if (!this.requirementsCheck(command, message)) {
      message.channel.createMessage(
        `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
      )
      return
    } else if (args.length === 0 && command.argsRequired) {
      message.channel.createMessage('Invalid usage.')
      return
      // Guild and DM only.
    } else if (command.guildOnly && message.channel.type !== 0) return
    else if (command.dmOnly && message.channel.type !== 1) return
    // We get the exact content to send.
    const messageToSend = await this.fixCommand(session, message, args)
    // We define a sent variable to keep track.
    let sent
    if ( // No permission protection is here as well.
      messageToSend && message.member.guild.channels.find(i => i.id === message.channel.id)
        .permissionsOf(this.client.user.id).has('sendMessages')
    ) sent = await message.channel.createMessage(messageToSend)
    if (session.postGenerator) session.postGenerator(message, args, sent)
    if (command.deleteCommand) message.delete('Automatically deleted by IveBot.')
  }

  onMessage (message: Message) {
    // We need to add calls for the other message callback.
    const commandExec = message.content.split(' ')[0].substr(1).toLowerCase()
    if (!commandExec.startsWith('/')) return // Don't process it if it's not a command.
    // Webhook and bot protection.
    try { if (message.author.bot) return } catch (e) { return }
    // Check for the commands in this.commands.
    const keys = Object.keys(this.commands)
    for (let i = 0; i < keys.length; i++) {
      if (commandExec === keys[i]) {
        // Execute command.
        try {
          this.executeCommand(this.commands[keys[i]], message)
        } catch (e) { message.channel.createMessage('IveBot has experienced an internal error.') }
        break
      } else if (this.commands[keys[i]].aliases.includes(commandExec)) {
        // Execute command.
        try {
          this.executeCommand(this.commands[keys[i]], message)
        } catch (e) { message.channel.createMessage('IveBot has experienced an internal error.') }
        break
      }
    }
  }
}
// if no command call the other callback in index.ts just cuz yeah
// go port everything in bot/commands to oldCommands and get forwardporting.. :v
