import { Message, MessageContent, Client } from 'eris'
import { DB, Command as IveBotCommand, IveBotCommandGenerator, Context } from './imports/types'
import { Db } from 'mongodb'
import { getInsult } from './imports/tools'
import botCallback from '.'

function isEquivalent (a: { [index: string]: boolean }, b: { [index: string]: boolean }) {
  // Create arrays of property names
  var aProps = Object.getOwnPropertyNames(a)
  var bProps = Object.getOwnPropertyNames(b)

  // If number of properties is different, objects are not equivalent
  if (aProps.length !== bProps.length) return false

  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i]

    // If values of same property are not equal, objects are not equivalent
    if (a[propName] !== b[propName]) return false
  }

  // If we made it this far, objects are considered equivalent
  return true
}

export class Command {
  /* eslint-disable no-undef */
  name: string
  aliases: string[]
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
  requirements: {
    userIDs?: string[]
    roleNames?: string[],
    custom?: (message: Message) => boolean,
    permissions?: {},
    roleIDs?: string[]
  }
  /* eslint-enable no-undef */

  constructor (command: IveBotCommand) {
    // Key functions.
    this.name = command.name
    this.aliases = command.aliases
    this.generator = command.generator
    this.postGenerator = command.postGenerator
    // Options.
    this.argsRequired = command.opts.argsRequired === undefined || command.opts.argsRequired
    this.invalidUsageMessage = command.opts.invalidUsageMessage || 'Invalid usage.'
    this.errorMessage = command.opts.errorMessage || 'IveBot has experienced an internal error.'
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

  requirementsCheck (message: Message) {
    if (!this.requirements) return true
    // No role name or ID impl.
    const userIDs = this.requirements.userIDs // If it doesn't exist it's a pass.
      ? this.requirements.userIDs.includes(message.author.id)
      : false // Next line calls custom if it exists.
    const custom = this.requirements.custom ? this.requirements.custom(message) : false
    // If it's not a guild there are no permissions.
    if (message.channel.type !== 0) return userIDs || custom
    const permissions = this.requirements.permissions
      ? isEquivalent(Object.assign( // Assign the required permissions onto the member's permission.
        message.member.permission.json, this.requirements.permissions
      ), message.member.permission.json) // This should eval true if user has permissions.
      : false
    // If any of these are true, it's a go.
    return userIDs || custom || permissions
  }

  async execute (context: Context, message: Message, args: string[]) { // eslint-disable-line indent
    // Define 2 vars.
    let messageToSend: MessageContent | void | Promise<MessageContent> | Promise<void>
    // If it's a function, we call it first.
    if (typeof this.generator === 'function') messageToSend = this.generator(message, args, context)
    else messageToSend = this.generator
    // We don't process Promises because we unconditionally return a Promise.
    // Async functions returning arrays aren't supported.
    return messageToSend
  }
}

export default class CommandParser {
  commands: { [name: string]: Command } // eslint-disable-line no-undef
  client: Client // eslint-disable-line no-undef
  tempDB: DB // eslint-disable-line no-undef
  db: Db // eslint-disable-line no-undef
  evaluatedMessages: string[] // eslint-disable-line no-undef
  // eslint-disable-next-line no-undef
  analytics: { name: string, totalUse: number, averageExecTime: number[] }[]

  constructor (client: Client, tempDB: DB, db: Db) {
    this.commands = {}
    this.client = client
    this.tempDB = tempDB
    this.db = db
    this.analytics = []
    this.evaluatedMessages = []
    this.onMessage = this.onMessage.bind(this)
    this.onMessageUpdate = this.onMessageUpdate.bind(this)
    setInterval(() => this.sendAnalytics(), 30000)
  }

  registerCommand = (command: IveBotCommand) => { // eslint-disable-line no-undef
    this.commands[command.name] = new Command(command)
  }

  async executeCommand (command: Command, message: Message) {
    // We give our generators what they need.
    const context: Context = {
      tempDB: this.tempDB, db: this.db, commandParser: this, client: this.client
    }
    const args = message.content.trim().split(' ').filter(i => i).slice(1)
    // Guild and DM only.
    if (command.guildOnly && message.channel.type !== 0) return
    else if (command.dmOnly && message.channel.type !== 1) return
    // Check for permissions.
    else if (!command.requirementsCheck(message)) {
      message.channel.createMessage(
        `**Thankfully, you don't have enough permissions for that, you ${getInsult()}.**`
      )
      return
      // We check for arguments.
    } else if (args.length === 0 && command.argsRequired) {
      message.channel.createMessage(command.invalidUsageMessage)
      return
    }
    // Delete the message if needed.
    try {
      if (command.deleteCommand) message.delete('Automatically deleted by IveBot.')
    } catch (e) {}
    // We get the exact content to send.
    const messageToSend = await command.execute(context, message, args)
    // We define a sent variable to keep track.
    let sent
    if ( // No permission protection is here as well.
      messageToSend && ((message.member &&
      message.member.guild.channels.find(i => i.id === message.channel.id)
        .permissionsOf(this.client.user.id).has('sendMessages')) || message.channel.type === 1)
    ) sent = await message.channel.createMessage(messageToSend)
    if (command.postGenerator) command.postGenerator(message, args, sent, context)
  }

  async saveAnalytics (timeTaken: [number, number], name: string) {
    // Get the local command info.
    let commandInfo = this.analytics.find(i => i.name === name)
    // If there is no info for the command then insert an object for it.
    if (!commandInfo) {
      this.analytics.push({ name, averageExecTime: [0, 0], totalUse: 0 })
      commandInfo = this.analytics.find(i => i.name === name)
    }
    // Calculate the average time of execution taken.
    const averageExecTime = commandInfo.averageExecTime.map((i: number, index: number) => (
      ((i * commandInfo.totalUse) + timeTaken[index]) / (commandInfo.totalUse + 1)
    ))
    // Update local cache with analytics.
    this.analytics[this.analytics.indexOf(commandInfo)].totalUse += 1
    this.analytics[this.analytics.indexOf(commandInfo)].averageExecTime = averageExecTime
  }

  async sendAnalytics () {
    const analytics = this.db.collection('analytics')
    // Iterate over every command we have information stored locally.
    for (let index in this.analytics) {
      const command = this.analytics[index]
      // Get the data for the selected command.
      const statistics = await analytics.findOne({ name: command.name })
      // If the command was not stored, we store our analytics directly.
      if (!statistics) analytics.insertOne(command)
      // Else, we update existing command data in the database.
      else {
        // Calculate the average execution time and update the database.
        const averageExecTime = statistics.averageExecTime.map((i: number, index: number) => (
          (
            (i * statistics.totalUse) + (command.averageExecTime[index] * command.totalUse)
          ) / (statistics.totalUse + command.totalUse)
        ))
        analytics.updateOne({ name: command.name }, {
          $inc: { totalUse: command.totalUse },
          $set: { averageExecTime }
        })
      }
      // Clear analytics for the specific index.
      this.analytics[index].totalUse = 0
      this.analytics[index].averageExecTime = [0, 0]
    }
  }

  async onMessage (message: Message) {
    if (message.content && !message.content.startsWith('/')) {
      botCallback(message, this.client, this.tempDB, this.db)
      return // Don't process it if it's not a command.
    }
    const commandExec = message.content.split(' ')[0].substr(1).toLowerCase()
    // Webhook and bot protection.
    try { if (message.author.bot) return } catch (e) { return }
    // Check for the command in this.commands.
    const keys = Object.keys(this.commands)
    for (let i = 0; i < keys.length; i++) {
      if (commandExec === keys[i].toLowerCase() || (
        this.commands[keys[i]].aliases && this.commands[keys[i]].aliases.includes(commandExec)
      )) {
        // We mark the command as evaluated and schedule a removal of the ID in 30 seconds.
        this.evaluatedMessages.push(message.id)
        setTimeout(() => {
          this.evaluatedMessages.splice(this.evaluatedMessages.findIndex(i => i === message.id), 1)
        }, 30000)
        // Execute command.
        try {
          const executeFirst = process.hrtime() // Initial high-precision time.
          await this.executeCommand(this.commands[keys[i]], message)
          const executeSecond = process.hrtime(executeFirst) // Time difference.
          this.saveAnalytics(executeSecond, keys[i]) // Send analytics.
        } catch (e) {
          // On error, we tell the user of an unknown error and log it for our reference.
          message.channel.createMessage(this.commands[keys[i]].errorMessage)
          console.error(e)
        }
        return
      }
    }
    botCallback(message, this.client, this.tempDB, this.db)
  }

  // For evaluating messages which weren't evaluated.
  async onMessageUpdate (message: Message, oldMessage?: Message) {
    // We won't bother with a lot of messages..
    if (message.content && !message.content.startsWith('/')) return
    else if (this.evaluatedMessages.includes(message.id)) return
    else if (!oldMessage || Date.now() - message.timestamp > 30000) return
    else if (message.editedTimestamp - message.timestamp > 30000) return
    // Proceed to evaluate.
    const commandExec = message.content.split(' ')[0].substr(1).toLowerCase()
    // Webhook and bot protection.
    try { if (message.author.bot) return } catch (e) { return }
    // Check for the command in this.commands.
    const keys = Object.keys(this.commands)
    for (let i = 0; i < keys.length; i++) {
      if (commandExec === keys[i].toLowerCase() || (
        this.commands[keys[i]].aliases && this.commands[keys[i]].aliases.includes(commandExec)
      )) {
        // We mark the command as evaluated and schedule a removal of the ID in 30 seconds.
        this.evaluatedMessages.push(message.id)
        setTimeout(() => {
          this.evaluatedMessages.splice(this.evaluatedMessages.findIndex(i => i === message.id), 1)
        }, 30000)
        // Execute command.
        try {
          const executeFirst = process.hrtime() // Initial high precision time.
          await this.executeCommand(this.commands[keys[i]], message)
          const executeSecond = process.hrtime(executeFirst) // Time difference.
          this.saveAnalytics(executeSecond, keys[i]) // Send analytics.
        } catch (e) {
          // On error, we tell the user of an unknown error and log it for our reference.
          message.channel.createMessage(this.commands[keys[i]].errorMessage)
          console.error(e)
        }
        return
      }
    }
  }
}
