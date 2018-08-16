import {
  CommandClient,
  Command as ErisCommand,
  CommandGenerator,
  Hooks,
  GenericCheckFunction
} from 'eris'

export class Command extends ErisCommand {
  example: string // eslint-disable-line no-undef

  constructor (label: string, generator: CommandGenerator, options?: IveBotCommandOptions) {
    super(label, generator, options || {})
    this.example = options ? options.example : 'N/A'
  }
}

export default class IveBotCommandClient extends CommandClient {
  /* eslint-disable no-undef */
  commands: { [label: string]: Command }
  commandAliases: { [alias: string]: string }
  commandOptions: IveBotCommandClientOptions
  /* eslint-enable no-undef */

  // Code from Eris here.
  registerCommand (
    label: string, generator: CommandGenerator, options: IveBotCommandOptions = {}
  ) {
    if (label.includes(' ')) throw new Error('Command label may not have spaces')
    let lowercaseCommand = label.toLowerCase()
    if (
      this.commands[label] ||
      (this.commands[lowercaseCommand] && this.commands[lowercaseCommand].caseInsensitive)
    ) throw new Error('You have already registered a command for ' + label)
    // Aliases are not deleted when deleting commands
    let command = this.commandAliases[label] // Just to make the following if statement less messy
    lowercaseCommand = this.commandAliases[label.toLowerCase()]
    if (
      this.commands[command] ||
      (this.commands[lowercaseCommand] && this.commands[lowercaseCommand].caseInsensitive)
    ) throw new Error(`Alias ${label} already registered`)
    options.defaultSubcommandOptions = options.defaultSubcommandOptions || {}
    for (const key in this.commandOptions.defaultCommandOptions) {
      if (this.commandOptions.defaultCommandOptions.hasOwnProperty(key) && options[key] === undefined) {
        options[key] = this.commandOptions.defaultCommandOptions[key]
        options.defaultSubcommandOptions[key] = this.commandOptions.defaultCommandOptions[key]
      }
    }
    label = options.caseInsensitive === true ? label.toLowerCase() : label
    if (this.commands[label]) {
      throw new Error('You have already registered a command for ' + label)
    }
    command = this.commandAliases[label]
    if (this.commands[command]) {
      throw new Error(`Alias ${command} already registered`)
    }
    if (options.aliases) {
      options.aliases.forEach((alias) => {
        lowercaseCommand = alias.toLowerCase()
        if (this.commands[alias] || (this.commands[lowercaseCommand] && this.commands[lowercaseCommand].caseInsensitive)) {
          throw new Error('You have already registered a command for alias ' + alias)
        }
        command = this.commandAliases[alias]
        lowercaseCommand = this.commandAliases[alias.toLowerCase()]
        if (
          this.commands[command] ||
          (this.commands[lowercaseCommand] && this.commands[lowercaseCommand].caseInsensitive)
        ) {
          throw new Error(`Alias ${alias} already registered`)
        }
        alias = options.caseInsensitive === true ? alias.toLowerCase() : alias
        if (this.commands[alias]) {
          throw new Error('You have already registered a command for alias ' + alias)
        }
        command = this.commandAliases[alias]
        if (this.commands[command]) {
          throw new Error(`Alias ${alias} already registered`)
        }
        this.commandAliases[alias] = label
      })
    }
    this.commands[label] = new Command(label, generator, options)
    return this.commands[label]
  }
}

// Code from Eris here.
/* eslint-disable no-undef */
export interface IveBotCommandOptions {
  [index: string]: Object,
  example?: string,
  aliases?: string[],
  caseInsensitive?: boolean,
  deleteCommand?: boolean,
  argsRequired?: boolean,
  guildOnly?: boolean,
  dmOnly?: boolean,
  description?: string,
  fullDescription?: string,
  usage?: string,
  hooks?: Hooks,
  requirements?: {
    userIDs?: string[] | GenericCheckFunction<string[]>,
    roleIDs?: string[] | GenericCheckFunction<string[]>,
    roleNames?: string[] | GenericCheckFunction<string[]>,
    permissions?: { [s: string]: boolean } | GenericCheckFunction<{ [s: string]: boolean }>,
    custom?: GenericCheckFunction<void>
  },
  cooldown?: number,
  cooldownExclusions?: {
    userIDs?: string[],
    guildIDs?: string[],
    channelIDs?: string[]
  },
  restartCooldown?: boolean,
  cooldownReturns?: number,
  cooldownMessage?: string | GenericCheckFunction<string>,
  invalidUsageMessage?: string | GenericCheckFunction<string>,
  permissionMessage?: string | GenericCheckFunction<string>,
  errorMessage?: string | GenericCheckFunction<string>,
  reactionButtons?: Array<{ emoji: string, type: string, response: CommandGenerator }>,
  reactionButtonTimeout?: number,
  defaultSubcommandOptions?: IveBotCommandOptions,
  hidden?: boolean
}

interface IveBotCommandClientOptions {
  defaultHelpCommand?: boolean,
  description?: string,
  ignoreBots?: boolean,
  ignoreSelf?: boolean,
  name?: string,
  owner?: string,
  prefix?: string | string[],
  defaultCommandOptions?: IveBotCommandOptions
} /* eslint-enable no-undef */
