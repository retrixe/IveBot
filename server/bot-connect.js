// Tokens and stuff.
const { Client } = require('discord.io')
require('json5/lib/require')
const { token } = require('../config.json5')

// Online since?
let onlineSince = Math.abs(new Date().getTime())

// Require the bot, built ot unbuilt.
let botCallback
try {
  botCallback = require('../lib/index').default
} catch (e) {
  require('babel-register')
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
client.on('disconnect', (errMsg, code) => console.log('Error:\n', errMsg, code))

// Create a database to handle certain stuff.
const tempDB = {gunfight: []}

// When client recieves a message, it will callback.
client.on('message', botCallback(client, tempDB, onlineSince))

// Export some stuff for our server to use, you know.
module.exports = {
  tempDB,
  onlineSince,
  client
}
