// We need types.
import { DB } from './imports/types'
import { Member, Message } from 'eris'
import CommandClient from './imports/CustomClient'
import { Db } from 'mongodb'

// Database reading function.
import { getServerSettings } from './imports/tools'

// When client gains/loses a member, it will callback.
export const guildMemberEditCallback = (client: CommandClient, event: string, db: Db) => async (
  guild: { id: string }, member: Member
) => { // eslint-disable-line indent
  // WeChill specific configuration.
  if (guild.id === '402423671551164416' && event === 'guildMemberRemove') {
    const message = `Well ${member.user.username}#${member.user.discriminator} left us.`
    client.createMessage('402437089557217290', message)
    return // Why wait.
  } else if (guild.id === '402423671551164416' && event === 'guildMemberAdd') {
    const message = `Yoyo <@${member.id}> welcome to WeChill, stay chill.`
    client.createMessage('402437089557217290', message)
    return // Why wait.
  }
  const serverSettings = await getServerSettings(db, guild.id)
  /* if (event === 'guildMemberRemove' && serverSettings.joinLeaveMessages[2]) {
    const channelID = member.guild.channels.find(
      i => i.name === serverSettings.joinLeaveMessages[0]
    ).id
    client.createMessage(channelID, serverSettings.joinLeaveMessages[2])
  } else if (event === 'guildMemberAdd' && serverSettings.joinLeaveMessages[1]) {
    const channelID = member.guild.channels.find(
      i => i.name === serverSettings.joinLeaveMessages[0]
    ).id
    client.createMessage(channelID, serverSettings.joinLeaveMessages[1])
  } */
  if (event === 'guildMemberAdd' && serverSettings.joinAutorole) {
    const roles = serverSettings.joinAutorole.split('|')
    for (let x = 0; x < roles.length; x++) {
      const roleID = member.guild.roles.find(element => element.name === roles[x]).id
      if (roles[x].startsWith('bot-') && member.user.bot) member.addRole(roleID)
      else if (!roles[x].startsWith('bot-') && !member.user.bot) member.addRole(roleID)
    }
  }
}

// When client recieves a message, it will callback.
export default async (message: Message, client: CommandClient, tempDB: DB, db: Db) => {
  // Disable bots and webhooks from being responded to.
  try { if (message.author.bot) return } catch (e) { return }
  try {
    if (
      !message.member.guild.channels.find(i => i.id === message.channel.id)
        .permissionsOf(client.user.id).has('sendMessages')
    ) return
  } catch (e) {}
  // Content of message and sendResponse.
  const sendResponse = message.channel.createMessage
  const command = message.content.toLowerCase()
  // Help command.
  // Auto responses and easter eggs.
  if (command.startsWith('is dot a good boy')) sendResponse('Shame on you. He\'s undefined.')
  else if (command.startsWith('iphone x')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('triggered')) sendResponse('Ah, pathetic people again.')
  else if (command.startsWith('ayy')) sendResponse('lmao')
  // Handle answers to gunfight.
  // else if (command in ['fire', 'water', 'gun', 'dot']) return
}
