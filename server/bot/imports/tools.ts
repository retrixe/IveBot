import { Db } from 'mongodb'
import { Message } from 'eris'

export const getArguments = (message: string) => {
  const splitMessage = message.split(' ')
  splitMessage.shift()
  return splitMessage.join(' ').trim()
}

export const getDesc = (message: { content: string }) => getArguments(message.content)

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
  const mentions = message.mentions
  const guild = message.member.guild
  if (guild.members.find(i => i.id === arg)) return guild.members.find(i => i.id === arg).user
  else if (mentions.length && mentions[0].id === getIdFromMention(arg)) return mentions[0]
  else if (guild.members.find(i => i.username.toLowerCase() === arg.toLowerCase())) {
    return guild.members.find(i => i.username.toLowerCase() === arg.toLowerCase()).user
  } else if (guild.members.find(
    i => i.username.toLowerCase() + '#' + i.discriminator === arg.toLowerCase()
  )) {
    return guild.members.find(
      i => i.username.toLowerCase() + '#' + i.discriminator === arg.toLowerCase()
    ).user
  }
}

// Fresh insults. They come and go, I suppose.
export const getInsult = () => {
  const insults = [
    'pathetic lifeform', 'ungrateful bastard', 'idiotic slimeball', 'worthless ass', 'dumb dolt'
  ]
  return insults[Math.floor(Math.random() * insults.length)]
}
