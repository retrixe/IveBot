import React, { useState } from 'react'
import {
  Typography, Paper, List, ListItem, ListItemText, Avatar, Hidden, Divider, IconButton,
  LinearProgress
} from '@material-ui/core'
import ArrowBack from '@material-ui/icons/ArrowBack'
import { useLazyQuery, gql } from '@apollo/client'
import { ServerInfo, DiscordUser } from './graphqlTypes'
import Settings from './settings'

const GET_SERVER_SETTINGS = gql`
  query GetServerSettings($id: String!) {
    serverSettings: getServerSettings(id: $id) {
      id
      addRoleForAll
      joinAutorole
      joinLeaveMessages {
        channel
        joinMessage
        leaveMessage
        banMessage
      }
      ocrOnSend
    }
  }
`

const Dashboard = (props: {
  data: { servers: ServerInfo[], user: Omit<DiscordUser, 'id'> }
}): JSX.Element => {
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null)
  const [getServerSettings, { loading, data, error }] = useLazyQuery(GET_SERVER_SETTINGS)

  const nameOfServer = selectedServer && selectedServer.name.length >= 20
    ? selectedServer.name.substr(0, 20) + '...'
    : selectedServer?.name
  const settings = selectedServer
    ? (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
          <IconButton
            color='primary' style={{
              marginRight: 10
            }} onClick={() => setSelectedServer(null)}
          >
            <ArrowBack />
          </IconButton>
          {selectedServer.icon === 'no icon' ? '' : <Avatar src={selectedServer.icon} />}
          <Typography style={{ marginLeft: 10 }} variant='h6' component='h1'>
            {nameOfServer} <Hidden mdDown>({selectedServer.id})</Hidden>
          </Typography>
        </div>
        <Divider />
        {error
          ? <Typography color='error'>An error occurred:<br />{error.message}</Typography>
          : (loading || !data
              ? <LinearProgress color='secondary' variant='query' />
              : <Settings data={data.serverSettings} server={selectedServer} />
            )}
      </>
      )
    : (
      <List>
        {props.data.servers.map(element => {
          let nameOfServer = element.name ? element.name : ''
          if (nameOfServer.length >= 32) nameOfServer = element.name.substr(0, 29) + '...'
          return (
            <ListItem
              disabled={!element.perms} divider button key={element.id}
              onClick={() => {
                getServerSettings({ variables: { id: element.id } })
                setSelectedServer(element)
              }}
            >
              {element.icon === 'no icon' ? '' : <Avatar src={element.icon} />}
              <ListItemText primary={nameOfServer} secondary={element.id} />
            </ListItem>
          )
        })}
      </List>
      )
  return (
    <Paper style={{ marginLeft: '2%', marginRight: '2%', padding: 10 }}>
      {settings}
    </Paper>
  )
}

export default Dashboard
