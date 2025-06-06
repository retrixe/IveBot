import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { gql } from 'graphql-tag'
import resolvers from '../../imports/server/resolvers'

const typeDefs = gql`
  """
  Joining and leaving servers.
  """
  type JoinLeaveMessages {
    """
    What to post when a user is banned.
    """
    banMessage: String
    """
    ID of channel.
    """
    channel: String
    """
    What to post when joining.
    """
    joinMessage: String
    """
    What to post when leaving.
    """
    leaveMessage: String
  }

  """
  Channel type.
  """
  type Channel {
    """
    Channel ID.
    """
    id: String!
    """
    Channel name.
    """
    name: String!
  }

  """
  Info about a Discord user via OAuth.
  """
  type User {
    """
    Discord profile picture.
    """
    avatar: String!
    """
    Discord ID.
    """
    id: String!
    """
    Discord username#discriminator.
    """
    identifier: String!
  }

  """
  Server type.
  """
  type Server {
    """
    ID of server.
    """
    id: String!
    """
    Icon of server.
    """
    icon: String
    """
    Name of server.
    """
    name: String
    """
    Permission to manage it?
    """
    perms: Boolean
    """
    Channels in server.
    """
    channels: [Channel]
  }

  """
  Server specific settings.
  """
  type ServerSetting {
    """
    Server ID.
    """
    id: String!
    """
    If add role is enabled for everyone.
    """
    publicRoles: String
    """
    If join autorole is enabled, and if so, what role.
    """
    joinAutorole: String
    """
    If join/leave messages are enabled, and if so, what message and channel.
    """
    joinLeaveMessages: JoinLeaveMessages
    """
    If text recognition on image send is enabled.
    """
    ocrOnSend: Boolean
  }

  """
  Enable queries.
  """
  type Query {
    """
    Query server settings.
    """
    getServerSettings(
      """
      Discord ID of server to get settings of.
      """
      id: String!
    ): ServerSetting!
    """
    Get the user's username, discriminator and avatar.
    """
    getUserInfo: User!
    """
    Get the current user's servers.
    """
    getUserServers: [Server!]!
  }

  """
  Input for modifying join/leave messages.
  """
  input JoinLeaveMessagesInput {
    """
    What to post when a user is banned.
    """
    banMessage: String
    """
    ID of channel.
    """
    channel: String!
    """
    What to post when joining.
    """
    joinMessage: String
    """
    What to post when leaving.
    """
    leaveMessage: String
  }

  """
  Input for editServerSettings mutation.
  """
  input EditServerSettingsInput {
    """
    Edit join autorole through this setting.
    """
    joinAutorole: String
    """
    Edit join leave messages through this setting.
    """
    joinLeaveMessages: JoinLeaveMessagesInput
    """
    Edit text recognition on image send through this setting.
    """
    ocrOnSend: Boolean
    """
    Enable public roles through this setting.
    """
    publicRoles: String
  }

  """
  Enable mutations.
  """
  type Mutation {
    """
    Edit server settings.
    """
    editServerSettings(
      """
      Discord ID of server to edit settings of.
      """
      id: String!
      """
      New settings for Discord server.
      """
      newSettings: EditServerSettingsInput!
    ): ServerSetting!
  }

  schema {
    mutation: Mutation
    query: Query
  }
`

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

export default startServerAndCreateNextHandler(server, {
  context: async (req: NextApiRequest, res: NextApiResponse) => await Promise.resolve({ req, res }),
})
