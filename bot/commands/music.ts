// Import types.
import { client } from '../imports/types'

export function handleJoin (sendResponse: Function, client: client, userID: string, channel: string) {
  client.joinVoiceChannel(
    client.servers[client.channels[channel].guild_id].members[userID].voice_channel_id,
    (err: string) => {
      if (err) {
        sendResponse('Could not join voice channel. Are you in a voice channel I can access?')
        return
      }
      sendResponse('Joined voice channel.')
    }
  )
}
