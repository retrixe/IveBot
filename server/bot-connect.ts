// Tokens and stuff.
import { Client } from 'discord.io'
import 'json5/lib/require'
const { token } = require('../config.json5')

// Online since?
let onlineSince = Math.abs(new Date().getTime())

// Require the bot, built ot unbuilt.
let botCallback
try {
  botCallback = require('../lib/index').default
} catch (e) {
  botCallback = require('../bot/index').default
}

// Create a client to connect to Discord API Gateway.
const client = new Client({
  token,
  autorun: true
})

// On connecting..
client.on('ready', () => {
  console.log('Connected to Discord.')
  client.sendMessage({ to: '361577668677861399', message: ``, typing: true })
  client.setPresence({
    game: {
      type: 1,
      name: 'DXMD (5k) on iMac Pro.',
      url: 'https://twitch.tv/sorrybutyoudontdeservewatchingthisgameunlessyouhaveamacipadoriphone'
    },
    idle_since: null
  })
})

// Disconnection from Discord will trigger the following.
client.on('disconnect', (errMsg, code) => {
  console.log('Error:\n', errMsg, code)
  throw new Error('Error:\n' + ' ' + errMsg + ' ' + code)
})

// Create a database to handle certain stuff.
const tempDB = {gunfight: []}

// When client recieves a message, it will callback.
client.on('message', botCallback(client, tempDB, onlineSince))

// WeChill specific configuration.
client.on('guildMemberAdd', (member, event) => {
  if (member.guild_id === '402423671551164416') {
    client.sendMessage({
      to: '402437089557217290',
      message: `Yoyo <@${member.id}> welcome to WeChill, stay chill.`
    })
    client.addToRole({
      serverID: member.guild_id,
      userID: member.id,
      roleID: '402429353096642561'
    })
  }
})
client.on('guildMemberRemove', (member, event) => {
  if (member.guild_id === '402423671551164416') {
    client.sendMessage({
      to: '402437089557217290',
      message: `Well ${event.d.user.username}#${event.d.user.discriminator} left us.`
    })
  }
})

// Export some stuff for our server to use, you know.
export default {
  tempDB,
  onlineSince,
  client
}
