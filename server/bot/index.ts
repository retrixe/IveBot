// We need types.
import { DB } from './imports/types'
import { Member, Message, Client, User, Guild, GuildTextableChannel } from 'eris'
import { Db } from 'mongodb'

// Database reading function.
import { getServerSettings } from './imports/tools'
// Tokens and stuffs.
import { cvAPIkey } from '../../config.json5'

// When a server gains a member, this function will be called.
export const guildMemberAdd = (client: Client, db: Db, tempDB: DB) => async (
  guild: Guild, member: Member
) => {
  // Mute persist.
  try {
    if (tempDB.mute[guild.id].includes(member.id)) {
      await member.addRole(guild.roles.find((role) => role.name === 'Muted').id, 'Persisting mute.')
    }
  } catch (e) {}
  // Get server settings.
  const serverSettings = await getServerSettings(db, guild.id)
  // If there's autorole enabled..
  if (serverSettings.joinAutorole) {
    // For each role..
    serverSettings.joinAutorole.split('|').forEach((role: string) => {
      try {
        const roleName = role.startsWith('bot-') ? role.substr(4) : role
        const roleObj = member.guild.roles.find(element => element.name === roleName)
        if (!role || !roleObj) return
        if (role.startsWith('bot-') && member.user.bot) member.addRole(roleObj.id)
        else if (!role.startsWith('bot-') && !member.user.bot) member.addRole(roleObj.id)
      } catch (e) {}
    })
  }
  // If join/leave messages is not configured/improperly configured..
  if (!serverSettings.joinLeaveMessages) return
  const { joinMessage, channel } = serverSettings.joinLeaveMessages
  if (!channel || !joinMessage) return
  // We send a message.
  try {
    const toSend = joinMessage
      .split('{un}').join(member.user.username) // Replace the username.
      .split('{m}').join(member.user.mention) // Replace the mention.
      .split('{d}').join(member.user.discriminator) // Replace the discriminator.
    await client.createMessage(channel, toSend)
  } catch (e) {}
}

// When a server loses a member, this function will be called.
export const guildMemberRemove = (client: Client, db: Db) => async (
  guild: Guild, member: Member|{ id: string, user: User }
) => {
  // Get server settings.
  const serverSettings = await getServerSettings(db, guild.id)
  // If join/leave messages is not configured/improperly configured..
  if (!serverSettings.joinLeaveMessages) return
  const { leaveMessage, channel, banMessage } = serverSettings.joinLeaveMessages
  if (!channel || !leaveMessage) return
  // If there is a ban message and the user is banned.
  if (banMessage && (await guild.getBans()).find(i => i.user.id === member.user.id)) return
  // We send a message.
  try {
    const toSend = leaveMessage
      .split('{un}').join(member.user.username) // Replace the username.
      .split('{m}').join(member.user.mention) // Replace the mention.
      .split('{d}').join(member.user.discriminator) // Replace the discriminator.
    await client.createMessage(channel, toSend)
  } catch (e) {}
}

// When a server bans a member, this function will be called.
export const guildBanAdd = (client: Client, db: Db) => async (guild: Guild, user: User) => {
  // Get server settings.
  const serverSettings = await getServerSettings(db, guild.id)
  // If join/leave messages is not configured/improperly configured..
  if (!serverSettings.joinLeaveMessages) return
  const { channel, banMessage } = serverSettings.joinLeaveMessages
  if (!channel || !banMessage) return
  // We send a message.
  try {
    const toSend = banMessage
      .split('{un}').join(user.username) // Replace the username.
      .split('{m}').join(user.mention) // Replace the mention.
      .split('{d}').join(user.discriminator) // Replace the discriminator.
    await client.createMessage(channel, toSend)
  } catch (e) { }
}

// When the bot leaves a server, this function will be called.
export const guildDelete = (db: Db) => async (guild: Guild) => {
  const settings = await db.collection('servers').findOne({ serverID: guild.id })
  if (settings) await db.collection('servers').deleteOne({ serverID: guild.id })
}

// When client recieves a message, it will callback.
export default async (message: Message, client: Client, tempDB: DB, db: Db) => {
  try {
    if ( // If there are no permissions do not do anything.
      !(message.channel as GuildTextableChannel)
        .permissionsOf(client.user.id).has('sendMessages')
    ) return
  } catch (e) {}
  // Content of message and sendResponse.
  const sendResponse = (m: string) => client.createMessage(message.channel.id, m)
  const command = message.content.toLowerCase()
  // Auto responses and easter eggs.
  if (command.startsWith('is dot a good boy')) sendResponse('Shame on you. He\'s undefined.')
  else if (command.startsWith('iphone x')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('iphone 11')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('iphone 12')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('iphone 13')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('iphone se')) sendResponse(`lol peasant`)
  else if (command.startsWith('triggered')) sendResponse('Ah, pathetic people again.')
  else if (command.startsWith('ayy')) sendResponse('lmao')
  // Handle answers to gunfight.
  else if (['fire', 'water', 'gun', 'dot'].includes(command)) {
    const key = Object.keys(tempDB.gunfight).find(i => (
      i.split('-')[0] === message.author.id || i.split('-')[1] === message.author.id
    ))
    if (!key) return
    const gunfight = tempDB.gunfight[key]
    if (!gunfight || !gunfight.wordSaid || gunfight.randomWord !== command) return
    sendResponse(`${message.author.mention} won!`)
    delete tempDB.gunfight[key]
  }

  // Get settings, server specific from now on.
  if (!message.member) return
  const serverSettings = await getServerSettings(db, message.member.guild.id)
  // Text recognition on image send \o/
  if (message.attachments.length && serverSettings.ocrOnSend) {
    // Get the image and convert it to Base64.
    try {
      const image = Buffer.from(await (await fetch(
        message.attachments[0].url
      )).arrayBuffer()).toString('base64')
      // Now send the request.
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${cvAPIkey}`, {
        body: JSON.stringify({
          requests: [{ image: { content: image }, features: [{ type: 'TEXT_DETECTION' }] }]
        }),
        method: 'POST'
      })
      // Parse the response.
      const result = (await res.json())
      // If no text was found.
      if (!result.responses[0].fullTextAnnotation) return
      // Return our answer.
      message.channel.createMessage({
        content: '**Text recognition result:**\n' + result.responses[0].fullTextAnnotation.text
      })
    } catch (e) {}
  }
}
