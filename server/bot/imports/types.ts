// Flow our types.
/* eslint-disable no-undef */
import { CommandClient, Member, Message, CommandOptions, CommandGenerator } from 'eris'
import { Db } from 'mongodb' // eslint-disable-line no-unused-vars

// eslint-disable-next-line no-use-before-define
export type IveBotCommand = (client: CommandClient, db?: DB, mongoDB?: Db) => {
  generator: CommandGenerator,
  opts: CommandOptions,
  name: string
}

export type FalseUser = { id: string, username: string, discriminator: string }

export class client extends CommandClient {}
export class member extends Member {}
export class message extends Message {}
export class event extends message {}
export type DB = {
  gunfight: Array<{
    challenged: string,
    challenger: string,
    accepted: boolean,
    randomWord: string,
    channelID: string
  }>,
  say: {
    // Channels.
    [index: string]: string
  },
  link: {
    [index: string]: string
  },
  leave: Array<string>
}
export type mongoDB = Db
/* eslint-enable no-undef */
