// Flow our types.
/* eslint-disable no-undef */
export type roleType = { TEXT_SEND_MESSAGES: boolean, VOICE_SPEAK: boolean, name: string, id: string, position: number }
export type client = {
  channels: {
    [index: string]: { guild_id: string } // eslint-disable-line camelcase
  },
  servers: {
    [index: string]: {
      name: string,
      roles: { [index: string]: roleType },
      // eslint-disable-next-line camelcase
      members: { [index: string]: { roles: Array<string>, voice_channel_id: boolean } }
    }
  },
  users: {
    [index: string]: { id: string, username: string, discriminator: string, bot: boolean, avatar: string }
  },
  sendMessage: Function,
  ban: Function,
  kick: Function,
  unban: Function,
  createRole: Function,
  editRole: Function,
  addToRole: Function,
  removeFromRole: Function,
  createDMChannel: Function,
  deleteMessage: Function,
  editMessage: Function,
  joinVoiceChannel: Function
}
export type event = {
  d: {
    channel_id: string, // eslint-disable-line camelcase
    author: {
      id: string,
      username: string,
      discriminator: string
    },
    id: string
  }
}
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
  }
}
/* eslint-enable no-undef */
