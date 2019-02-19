import { Db } from 'mongodb'
import { Message } from 'eris'

export const getIdFromMention = (mention: string) => {
  const f = mention.substring(2, mention.length - 1).split('!').join('').split('&').join('').split(':')
  return f[f.length - 1]
}

export const getServerSettings = async (db: Db, serverID: string) => {
  // Get serverSettings through query.
  let serverSettings = await db.collection('servers').find({ serverID }).toArray()
  if (serverSettings.length === 0) {
    // Initialize server settings.
    await db.collection('servers').insertOne({ serverID })
    serverSettings = await db.collection('servers').find({ serverID }).toArray()
  }
  return serverSettings[0]
}

export const zeroWidthSpace = '​'

export const getUser = (message: Message, arg: string) => {
  if (!arg || typeof arg !== 'string') return
  const mentions = message.mentions
  const guild = message.member.guild
  if (guild.members.has(arg)) return guild.members.get(arg).user
  else if (mentions.length && mentions[0].id === getIdFromMention(arg)) return mentions[0]
  else if (guild.members.find(i => i && i.username.toLowerCase() === arg.toLowerCase())) {
    return guild.members.find(i => i && i.username.toLowerCase() === arg.toLowerCase()).user
  } else if (guild.members.find(
    i => i && i.username.toLowerCase() + '#' + i.discriminator === arg.toLowerCase()
  )) {
    return guild.members.find(
      i => i && i.username.toLowerCase() + '#' + i.discriminator === arg.toLowerCase()
    ).user
  }
}

export const getChannel = (message: Message, arg: string) => {
  if (!arg || typeof arg !== 'string') return
  const mentions = message.channelMentions
  const guild = message.member.guild
  if (guild.channels.has(arg)) return guild.channels.get(arg)
  else if (mentions.length && mentions[0] === getIdFromMention(arg)) {
    return guild.channels.get(mentions[0])
  } else if (guild.channels.find(i => i.name === arg)) {
    return guild.channels.find(i => i.name === arg)
  } else if (guild.channels.find(i => i.name.toLowerCase() === arg.toLowerCase())) {
    return guild.channels.find(i => i.name.toLowerCase() === arg.toLowerCase())
  }
}

// Fresh insults. They come and go, I suppose.
export const getInsult = () => {
  const insults = [
    'pathetic lifeform', 'ungrateful bastard', 'idiotic slimeball', 'worthless ass', 'dumb dolt'
  ]
  return insults[Math.floor(Math.random() * insults.length)]
}
