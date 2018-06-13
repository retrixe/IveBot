// Tokens and stuff.
import 'json5/lib/require'
import { testPilots } from '../../config.json5'
// Commands.
import { handleEditLastSay } from './oldCommands/utilities'
import { handleWeather, handleCurrency, handleDefine } from './oldCommands/api'
import { handleClearwarns, handleRemovewarn, handleWarnings } from './oldCommands/admin/warn'
import { handleGiverole, handleTakerole } from './oldCommands/admin/roles'

// We need types.
import { client, DB, mongoDB, member, message } from './imports/types'
import { getServerSettings } from './imports/tools'
import help from './oldCommands/help'
import { Db } from 'mongodb'

// All commands which take (message, sendResponse) as args and can be appended and interpreted.
const appendableCommandMaps: { [index: string]: Function } = {
  // Currency conversion.
  '/currency': handleCurrency,
  '/cur': handleCurrency,
  // Define.
  '/define': handleDefine,
  '/def': handleDefine
}

// When client gains/loses a member, it will callback.
export const guildMemberEditCallback = (client: client, event: string, db: Db) => async (
  guild: { id: string }, member: member
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
  /* if (event.t === 'GUILD_MEMBER_REMOVE' && serverSettings.joinLeaveMessages[2]) {
    const channelID = Object.keys(client.servers[member.guild_id].channels).find(
      element => client.servers[member.guild_id].channels[element].name ===
        serverSettings.joinLeaveMessages[0]
    )
    client.sendMessage({
      to: client.servers[member.guild_id].channels[channelID].name,
      message: serverSettings.joinLeaveMessages[2]
    })
  } else if (event.t === 'GUILD_MEMBER_ADD' && serverSettings.joinLeaveMessages[1]) {
    const channelID = Object.keys(client.servers[member.guild_id].channels).find(
      element => client.servers[member.guild_id].channels[element].name ===
        serverSettings.joinLeaveMessages[0]
    )
    client.sendMessage({
      to: client.servers[member.guild_id].channels[channelID].name,
      message: serverSettings.joinLeaveMessages[1]
    })
  } */
  if (event === 'guildMemberAdd' && serverSettings.joinAutorole && !member.user.bot) {
    console.log(member, event)
    const roles = serverSettings.joinAutorole.split('|')
    for (let x = 0; x < roles.length; x++) {
      const roleID = client.guilds.find(a => a.id === guild.id).roles.find(
        element => element.name === roles[x]
      ).id
      client.addGuildMemberRole(guild.id, member.id, roleID)
    }
  }
}

// When client recieves a message, it will callback.
export default (client: client, tempDB: DB, db: mongoDB) => async (event: message) => {
  // Disable bots and webhooks from being responded to.
  try { if (event.author.bot) return } catch (e) { return }
  try {
    if (
      !event.member.guild.channels.find(i => i.id === event.channel.id)
        .permissionsOf(client.user.id).has('sendMessages')
    ) return
  } catch (e) {}
  // Content of message and sendResponse.
  const sendResponse = (content: string, embed?: {}) => client.createMessage(
    event.channel.id, embed ? content : { content, embed }
  )
  const channelID = event.channel.id
  const userID = event.author.id
  const message = event.content
  const command = event.content.toLowerCase()
  // Is the person a test pilot.
  const testPilot: string = testPilots.find((user: string) => user === userID)
  // Non-appendable commands which have to be re-defined on all callbacks. Taxing and waste of RAM.
  const commandMaps: { [index: string]: Function } = {
    // Weather.
    '/weather': () => handleWeather(message, sendResponse, client, channelID),
    '/wt': () => handleWeather(message, sendResponse, client, channelID),
    // Say.
    '/editLastSay': () => handleEditLastSay(event, sendResponse, client, testPilot, tempDB),
    '/els': () => handleEditLastSay(event, sendResponse, client, testPilot, tempDB),
    // Administrative commands.
    '/clearwarns': () => handleClearwarns(client, event, sendResponse, message, db),
    '/clearw': () => handleClearwarns(client, event, sendResponse, message, db),
    '/cw': () => handleClearwarns(client, event, sendResponse, message, db),
    '/removewarn': () => handleRemovewarn(client, event, sendResponse, message, db),
    '/removew': () => handleRemovewarn(client, event, sendResponse, message, db),
    '/rw': () => handleRemovewarn(client, event, sendResponse, message, db),
    '/warnings': () => handleWarnings(client, event, sendResponse, message, db),
    '/warns': () => handleWarnings(client, event, sendResponse, message, db),
    // Version, about, ping, uptime, remoteexec for remote command line.
    // Role system.
    // Certain commands rely on server settings. I hope we can await for them.
    '/giverole': async () => {
      const serverSettings = await getServerSettings(db, event.member.guild.id)
      handleGiverole(client, event, sendResponse, message, serverSettings)
    },
    '/gr': async () => {
      const serverSettings = await getServerSettings(db, event.member.guild.id)
      handleGiverole(client, event, sendResponse, message, serverSettings)
    },
    '/takerole': async () => {
      const serverSettings = await getServerSettings(db, event.member.guild.id)
      handleTakerole(client, event, sendResponse, message, serverSettings)
    },
    '/tr': async () => {
      const serverSettings = await getServerSettings(db, event.member.guild.id)
      handleTakerole(client, event, sendResponse, message, serverSettings)
    }
  }
  // Check for the commands in appendableCommandMaps.
  for (let i = 0; i < Object.keys(appendableCommandMaps).length; i++) {
    if (command.toLowerCase().split(' ')[0] === Object.keys(appendableCommandMaps)[i]) {
      appendableCommandMaps[Object.keys(appendableCommandMaps)[i]](message, sendResponse)
      break
    }
  }
  // Check for the commands in commandMaps.
  for (let i = 0; i < Object.keys(commandMaps).length; i++) {
    if (command.toLowerCase().split(' ')[0] === Object.keys(commandMaps)[i]) {
      commandMaps[Object.keys(commandMaps)[i]]()
      break
    }
  }
  // Help command.
  if (command.startsWith('/help') || command.startsWith('/halp')) help(command, client, channelID, userID)
  // Auto responses and easter eggs.
  else if (command.startsWith('is dot a good boy')) sendResponse('Shame on you. He\'s undefined.')
  else if (command.startsWith('iphone x')) sendResponse(`You don't deserve it. 😎`)
  else if (command.startsWith('triggered')) sendResponse('Ah, pathetic people again.')
  else if (command.startsWith('ayy')) sendResponse('lmao')
  // Handle answers to gunfight.
  // else if (command in ['fire', 'water', 'gun', 'dot']) return
}
