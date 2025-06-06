// We need types.
import type { DB } from './imports/types.ts'
import type {
  Member,
  Message,
  Client,
  User,
  Guild,
  GuildTextableChannel,
} from '@projectdysnomia/dysnomia'
import type { Db } from 'mongodb'

// Database reading function.
import { getServerSettings } from './imports/tools.ts'
// Tokens and stuffs.
import { cvAPIkey } from './config.ts'

// When a server gains a member, this function will be called.
export const guildMemberAdd =
  (client: Client, db: Db, tempDB: DB) => async (guild: Guild, member: Member) => {
    // Mute persist.
    try {
      if (tempDB.mute.has(`${guild.id}-${member.id}`)) {
        const role = guild.roles.find(role => role.name === 'Muted')
        if (role) await member.addRole(role.id, 'Persisting mute.')
      }
    } catch {}
    // Get server settings.
    const serverSettings = await getServerSettings(db, guild.id)
    // If there's autorole enabled..
    if (serverSettings.joinAutorole) {
      // For each role..
      serverSettings.joinAutorole.split('|').forEach(async (role: string) => {
        try {
          const roleName = role.startsWith('bot-') ? role.substring(4) : role
          const roleObj = member.guild.roles.find(element => element.name === roleName)
          if (!role || !roleObj) return
          if (role.startsWith('bot-') && member.user.bot) await member.addRole(roleObj.id)
          else if (!role.startsWith('bot-') && !member.user.bot) await member.addRole(roleObj.id)
        } catch {}
      })
    }
    // If join/leave messages is not configured/improperly configured..
    if (!serverSettings.joinLeaveMessages) return
    const { joinMessage, channel } = serverSettings.joinLeaveMessages
    if (!channel || !joinMessage) return
    // We send a message.
    try {
      const toSend = joinMessage
        .replaceAll('{un}', member.user.username) // Replace the username.
        .replaceAll('{m}', member.user.mention) // Replace the mention.
        .replaceAll('{d}', member.user.discriminator) // Replace the discriminator.
      await client.createMessage(channel, toSend)
    } catch {}
  }

// When a server loses a member, this function will be called.
export const guildMemberRemove =
  (client: Client, db: Db) => async (guild: Guild, member: Member | { id: string; user: User }) => {
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
        .replaceAll('{un}', member.user.username) // Replace the username.
        .replaceAll('{m}', member.user.mention) // Replace the mention.
        .replaceAll('{d}', member.user.discriminator) // Replace the discriminator.
      await client.createMessage(channel, toSend)
    } catch {}
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
      .replaceAll('{un}', user.username) // Replace the username.
      .replaceAll('{m}', user.mention) // Replace the mention.
      .replaceAll('{d}', user.discriminator) // Replace the discriminator.
    await client.createMessage(channel, toSend)
  } catch {}
}

// When the bot leaves a server, this function will be called.
export const guildDelete = (db: Db) => async (guild: Guild) => {
  const settings = await db.collection('servers').findOne({ id: guild.id })
  if (settings) await db.collection('servers').deleteOne({ id: guild.id })
}

// When client recieves a message, it will callback.
export default async (message: Message, client: Client, tempDB: DB, db: Db): Promise<void> => {
  try {
    // If there are no permissions do not do anything.
    const selfChannelPerms = (message.channel as GuildTextableChannel).permissionsOf(client.user.id)
    if (!selfChannelPerms.has('sendMessages')) return
  } catch {}
  // Content of message and sendResponse.
  const sendResponse = async (content: string): Promise<Message> =>
    await message.channel.createMessage(content)
  const command = message.content.toLowerCase()
  // Handle answers to trivia
  const session = tempDB.trivia.get(message.channel.id)
  if (session) {
    await session.checkAnswer(message)
  }
  // Auto responses and easter eggs.
  if (command.startsWith('is dot a good boy')) await sendResponse("Shame on you. He's undefined.")
  else if (command.startsWith('iphone x')) await sendResponse("You don't deserve it. 😎")
  else if (command.startsWith('iphone 11')) await sendResponse("You don't deserve it. 😎")
  else if (command.startsWith('iphone 12')) await sendResponse("You don't deserve it. 😎")
  else if (command.startsWith('iphone 13')) await sendResponse("You don't deserve it. 😎")
  else if (command.startsWith('iphone se')) await sendResponse('lol peasant')
  else if (command.startsWith('triggered')) await sendResponse('Ah, pathetic people again.')
  else if (command.startsWith('ayy')) await sendResponse('lmao')
  // Handle answers to gunfight.
  else if (['fire', 'water', 'gun', 'dot'].includes(command)) {
    const entry = tempDB.gunfight
      .entries()
      .find(([key]) => key.split('-').includes(message.author.id))
    if (!entry) return
    const [key, gunfight] = entry
    if (!gunfight.wordSaid || gunfight.randomWord !== command) return
    tempDB.gunfight.delete(key)
    await message.channel.createMessage(`${message.author.mention} won!`)
  }

  // Get settings, server specific from now on.
  if (!message.member) return
  const serverSettings = await getServerSettings(db, message.member.guild.id)
  // Text recognition on image send \o/
  const attachment = message.attachments.get(0)
  if (attachment && serverSettings.ocrOnSend) {
    // Get the image and convert it to Base64.
    try {
      const req = await fetch(attachment.url)
      const image = Buffer.from(await req.arrayBuffer()).toString('base64')
      // Now send the request.
      const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${cvAPIkey}`, {
        body: JSON.stringify({
          requests: [{ image: { content: image }, features: [{ type: 'TEXT_DETECTION' }] }],
        }),
        method: 'POST',
      })
      // Parse the response.
      const result = (await res.json()) as {
        responses: { fullTextAnnotation: { text: string } }[]
      }
      // If no text was found.
      if (!result.responses[0].fullTextAnnotation) return
      // Return our answer.
      await message.channel.createMessage({
        content: `**Text recognition result:**\n${result.responses[0].fullTextAnnotation.text}`,
      })
    } catch {}
  }
}
