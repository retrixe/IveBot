// Flow our types.
/* eslint-disable no-undef */
export type roleType = { TEXT_SEND_MESSAGES: boolean, VOICE_SPEAK: boolean, name: string, id: string, position: number }
export type client = {
  id: string,
  channels: {
    [index: string]: {
      guild_id: string, permissions: { // eslint-disable-line camelcase
        role: { [index: string]: { allow: number, deny: number } },
        user: { [index: string]: { allow: number, deny: number } }
      }
    }
  },
  servers: {
    [index: string]: {
      name: string,
      roles: { [index: string]: roleType },
      /* eslint-disable camelcase */
      members: { [index: string]: { roles: Array<string>, voice_channel_id: boolean } },
      owner_id: string
      /* eslint-enable camelcase */
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
  },
  link: {
    [index: string]: string
  }
}
export type mongoDB = {
  collection: Function
}
/* eslint-enable no-undef */
