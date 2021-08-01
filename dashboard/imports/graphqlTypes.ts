export interface ApolloBase {
  __typename?: string
}

export interface ServerInfo extends ApolloBase {
  perms: boolean
  icon: string
  id: string
  name: string
  channels: Array<{ name: string, id: string }>
}

export interface DiscordUser extends ApolloBase {
  id: string
  avatar: string
  identifier: string
}

export interface JoinLeaveMessages extends ApolloBase {
  channel: string
  joinMessage: string
  leaveMessage: string
  banMessage: string
}

export interface ServerSettings extends ApolloBase {
  joinLeaveMessages: JoinLeaveMessages
  addRoleForAll: string
  joinAutorole: string
  ocrOnSend: boolean
  id: string
}
