// Tokens and stuff.
import 'json5/lib/require'
import { testPilots, host } from '../../config.json5'
import { version } from '../../package.json'
import { execSync } from 'child_process'
import { randomBytes } from 'crypto'
import * as ms from 'ms'
// Commands.
import {
  handleEditLastSay, handleListserverregions,
  handleEdit, handleType, handleChangeserverregion
} from './oldCommands/utilities'
import {
  handleUrban, handleCat, handleDog, handleRobohash, handleApod, handleWeather, handleNamemc,
  handleCurrency,
  handleDefine
} from './oldCommands/api'
import {
  handleTakerole,
  handleGiverole, handleWarnings, handleClearwarns, handleRemovewarn
} from './oldCommands/admin'

// We need types.
import { client, DB, mongoDB, member, message } from './imports/types'
import { PrivateChannel } from 'eris'
import { getArguments, getServerSettings } from './imports/tools'
import help from './oldCommands/help'
import { Db } from 'mongodb'

// All commands which take (message, sendResponse) as args and can be appended and interpreted.
const appendableCommandMaps: { [index: string]: Function } = {
  // Currency conversion.
  '/currency': handleCurrency,
  '/cur': handleCurrency,
  // Define.
  '/define': handleDefine,
  '/def': handleDefine,
  // Urban.
  '/urban': handleUrban,
  '/urb': handleUrban,
  // Cat.
  '/cat': handleCat,
  // Dog.
  '/dog': handleDog,
  // Robohash.
  '/robohash': handleRobohash,
  '/robo': handleRobohash,
  '/rh': handleRobohash,
  // Astronomy picture of the day.
  '/astronomy-picture-of-the-day': handleApod,
  '/apod': handleApod,
  // List available server regions.
  '/listserverregions': handleListserverregions,
  '/lsr': handleListserverregions
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
    // Linking for authentication on the web dashboard.
    '/token': () => {
      let secureToken = randomBytes(3).toString('hex')
      tempDB.link[secureToken] = userID
      // The DM part.
      client.getDMChannel(userID).then((channel: PrivateChannel) => {
        client.createMessage(
          channel.id,
          'Your token is: **' + secureToken + '** | **DO NOT SHARE THIS WITH ANYONE >_<**'
        ).then((message: message) => {
          setTimeout(() => {
            client.deleteMessage(channel.id, message.id)
          }, 30000)
        }).catch(() => sendResponse('There was an error processing your request (unable to DM token)'))
      }).catch(() => sendResponse('There was an error processing your request (unable to DM)'))
      // The non-DM part.
      sendResponse('The token has been DMed ✅' +
        ' | **It will be deleted after 30 seconds.** | **DO NOT SHARE THIS WITH ANYONE >_<**'
      ).then((message: message) => {
        setTimeout(() => { client.deleteMessage(channelID, message.id) }, 30000)
      }).catch(() => sendResponse('There was an error processing your request.'))
    },
    // Weather.
    '/weather': () => handleWeather(message, sendResponse, client, channelID),
    '/wt': () => handleWeather(message, sendResponse, client, channelID),
    // NameMC port.
    '/namemc': () => handleNamemc(message, sendResponse, client, channelID),
    '/nmc': () => handleNamemc(message, sendResponse, client, channelID),
    // Say.
    '/type': () => handleType(event, sendResponse, client, testPilot, tempDB),
    '/editLastSay': () => handleEditLastSay(event, sendResponse, client, testPilot, tempDB),
    '/els': () => handleEditLastSay(event, sendResponse, client, testPilot, tempDB),
    '/edit': () => handleEdit(event, sendResponse, client),
    // Server region commands.
    '/changeserverregion': () => handleChangeserverregion(client, event, sendResponse, message),
    '/csr': () => handleChangeserverregion(client, event, sendResponse, message),
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
    '/version': () => sendResponse(`**IveBot ${version}**`),
    '/about': () => sendResponse(`**IveBot ${version}**
IveBot is a Discord bot written with Eris and care.
Unlike most other dumb bots, IveBot was not written with discord.js and has 0% copied code.
Built with community feedback mainly, IveBot does a lot of random stuff and fun.
IveBot 2.0 is planned to be built complete with administrative commands and a web dashboard.
For information on what IveBot can do, type **/help** or **/halp**.
The source code can be found here: <https://github.com/retrixe/IveBot>
For noobs, this bot is licensed and protected by law. Copy code and I will sue you for a KitKat.`),
    '/ping': () => {
      // Get current time.
      const startTime = new Date().getTime()
      // Then send a message.
      sendResponse('Ping?').then((message: message) => {
        // Latency (unrealistic, this can be negative or positive)
        const fl = startTime - new Date().getTime()
        // Divide latency by 2 to get more realistic latency and get absolute value (positive)
        const l = Math.abs(fl) / 2
        // Get latency.
        const e = l < 200 ? `latency of **${l}ms** 🚅🔃` : `latency of **${l}ms** 🔃`
        client.editMessage(
          channelID, message.id, `Aha! IveBot ${version} is connected to your server with a ${e}`
        ).catch(() => sendResponse('IveBot has experienced an internal error.'))
      })
    },
    '/uptime': () => sendResponse(ms(client.uptime, { long: true })),
    '/remoteexec': () => { if (userID === host) sendResponse(execSync(getArguments(message), { encoding: 'utf8' })) },
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
