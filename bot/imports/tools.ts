import { request } from 'graphql-request'

export const getArguments = (message: string) => {
  const splitMessage = message.split(' ')
  splitMessage.splice(0, 1)
  return splitMessage.join(' ').trim()
}

export const getIdFromMention = (mention: string) => mention.substring(2, mention.length - 1).split('!').join('')

export const getServerSettings = async (serverID: string) => {
  let a
  // First, get the server settings via query.
  const port = parseInt(process.env.PORT, 10) || 3000 // If port variable has been set.
  // eslint-disable-next-line typescript/no-explicit-any
  const res: any = await request(`http://localhost:${port}/graphql`, `
{
  serverSettings(serverId: "${serverID}") {
    addRoleForAll
    serverId
  }
}
  `)
  if (res.serverSettings.length === 0) {
    // eslint-disable-next-line typescript/no-explicit-any
    const initRes: any = await request(`http://localhost:${port}/graphql`, `
mutation {
  initServerSettings(serverId: "${serverID}") {
    addRoleForAll
    serverId
  }
}
    `)
    a = initRes.initServerSettings
  } else a = res.serverSettings
  return a
}
