// eslint-disable-next-line standard/object-curly-even-spacing
import { Message, Client /*, CommandGenerator */ } from 'eris'
import { DB, Command as IveBotCommand } from './imports/types'
import { Db } from 'mongodb'

export class Command {
  name: string // eslint-disable-next-line no-undef
  aliases: string[] // eslint-disable-next-line no-undef
  generators: (client: Client, db?: DB, mongoDB?: Db) => ({ // eslint-disable-next-line no-undef
    generator: string|Function // CommandGenerator,
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
    this.name = command.name
    this.aliases = command.aliases
    this.generators = command.generators
    // Options.
    this.argsRequired = command.opts.argsRequired
    this.caseInsensitive = command.opts.caseInsensitive
    this.deleteCommand = command.opts.deleteCommand
    this.guildOnly = command.opts.guildOnly
    this.dmOnly = command.opts.dmOnly
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

  registerCommand (command: IveBotCommand) {
    this.commands[command.name] = new Command(command)
  }

  requirementsCheck (command: Command, message: Message) {
    if (!command.requirements) return true
    // No role name or ID impl.
    const userIDs = command.requirements.userIDs
      ? command.requirements.userIDs.includes(message.author.id)
      : true
    const custom = command.requirements.custom ? command.requirements.custom() : true
    const permissions = command.requirements.permissions
      ? Object.assign(
        message.member.permission.json, command.requirements.permissions
      ) === message.member.permission.json
      : true
    return userIDs || custom || permissions
  }

  async executeCommand (command: Command, message: Message) {
    const session = command.generators(this.client, this.tempDB, this.db)
    const args = message.content.split(' ')
    args.shift()
    if (!this.requirementsCheck(command, message)) return
    let messageToSend = typeof session.generator === 'function'
      ? session.generator(message, args)
      : session.generator
    // No Array or Promise support lel.
    // if (messageToSend instanceof Promise) messageToSend = await messageToSend
    // if (messageToSend instanceof Array) messageToSend = messageToSend[Math.floor(Math.random() * messageToSend.length)]
    let sent
    if (messageToSend) sent = await message.channel.createMessage(messageToSend)
    if (session.postGenerator) session.postGenerator(message, args, sent)
  }

  onMessage (message: Message) {
    // We need to add calls for the other message callback.
    const commandExec = message.content.split(' ')[0].substr(1)
    if (!commandExec.startsWith('/')) return // Don't process it if it's not a command.
    // Check for the commands in this.commands.
    const keys = Object.keys(this.commands)
    for (let i = 0; i < keys.length; i++) {
      if (commandExec === keys[i]) {
        // Execute command.
        this.executeCommand(this.commands[keys[i]], message)
        break
      } else if (this.commands[keys[i]].aliases.includes(commandExec)) {
        // Execute command.
        break
      }
    }
  }
}
// class CommandParser
// We don't construct.. or maybe we do just a bit.
// Now we add registerCommand
// { name, ...opts, generator, postGenerator } hmm
// We have alias and all sorts of checks because we need to be cautious..
// now we add onMessage
// Execute permission checker, then generator and postGenerator
// if no command call the other callback in index.ts just cuz yeah
// permission checker
// Now we're literally done. fairly simple.
// go port everything in bot/commands to oldCommands and get forwardporting.. :v
