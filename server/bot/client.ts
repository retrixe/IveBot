// import { Message } from 'eris'

/* export class Command {
  constructor (command) {
    this.name = command.name
    this.aliases = command.aliases
    this.generator = command.generator
    this.postGenerator = command.postGenerator // serves as hooks.
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
} */

/* export class CommandParser {
  commands: { [name: string]: Command } // eslint-disable-line no-undef
  constructor () {
    this.commands = {}
  }

  registerCommand (command) {
    this.commands[command.name] = new Command(command)
  }

  permissionCheck (command: Command, message: Message) {
  }
} */
// class CommandParser
// We don't construct.. or maybe we do just a bit.
// Now we add registerCommand
// { name, ...opts, generator, postGenerator } hmm
// now we add onMessage
// Execute permission checker, then generator and postGenerator
// if no command call the other callback in index.ts just cuz yeah
// permission checker
// Now we're literally done. fairly simple.
// go port everything in bot/commands to oldCommands and get forwardporting.. :v
