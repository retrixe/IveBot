export interface ServerInfo {
  perms: boolean
  icon: string
  serverId: string
  name: string
  channels: Array<{ name: string, id: string }>
}

export interface ServerSettings {
  addRoleForAll: string
  joinAutorole: string
  ocrOnSend: boolean
  joinLeaveMessages: {
    channel: string
    joinMessage: string
    leaveMessage: string
    banMessage: string
  }
}
