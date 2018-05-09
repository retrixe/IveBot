// Flow our types.
/* eslint-disable no-undef */
import { Client, Member, Message } from 'eris'

export class client extends Client {}
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
  }
}
export type mongoDB = {
  collection: Function
}
/* eslint-enable no-undef */
