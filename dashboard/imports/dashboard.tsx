import React, { useState } from 'react'
import {
  Typography, Paper, List, ListItem, ListItemAvatar, ListItemText, Avatar, Hidden, Divider,
  IconButton, LinearProgress, styled, useMediaQuery, useTheme
} from '@mui/material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { useLazyQuery, gql } from '@apollo/client'
import type { ServerInfo, DiscordUser } from './graphqlTypes'
import Settings from './settings'

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  }
}))

const Banner = styled('div')(({ theme }) => ({
  padding: 8,
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  // [theme.breakpoints.down('xs')]: { alignItems: 'center' },
  [theme.breakpoints.down('sm')]: { width: '100%' },
  [theme.breakpoints.only('md')]: { width: '30%' },
  [theme.breakpoints.only('lg')]: { width: '25%' },
  [theme.breakpoints.only('xl')]: { width: '20%' }
}))

const AvatarImage = styled('img')(({ theme }) => ({
  borderRadius: '50%',
  marginBottom: '1em',
  [theme.breakpoints.down('sm')]: { maxWidth: 256 },
  [theme.breakpoints.up('md')]: { width: '100%' }
}))

const GET_SERVER_SETTINGS = gql`
  query GetServerSettings($id: String!) {
    serverSettings: getServerSettings(id: $id) {
      id
      publicRoles
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
  const largeDisplay = useMediaQuery(useTheme().breakpoints.up('lg'))
  const mobileDisplay = useMediaQuery(useTheme().breakpoints.down('xs'))
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
          if (nameOfServer.length >= 32) nameOfServer = element.name.substring(0, 29) + '...'
          return (
            <ListItem
              disabled={!element.perms} divider button key={element.id}
              onClick={() => {
                getServerSettings({ variables: { id: element.id } }).catch(console.error)
                setSelectedServer(element)
              }}
            >
              {element.icon !== 'no icon' && (
                <ListItemAvatar><Avatar src={element.icon} /></ListItemAvatar>
              )}
              <ListItemText primary={nameOfServer} secondary={element.id} />
            </ListItem>
          )
        })}
      </List>
      )
  const username = props.data.user.identifier.substring(0, props.data.user.identifier.lastIndexOf('#'))
  const textVariant = (largeDisplay || mobileDisplay) && username.length > 9
    ? username.length > 14 ? 'h6' : 'h5'
    : 'h4'

  return (
    <Root>
      <Banner>
        <AvatarImage
          src={props.data.user.avatar.replace('?size=128', '?size=4096')}
          alt='Avatar'
        />
        <Typography
          sx={{
            wordWrap: username.length > 17 ? 'break-word' : 'normal',
            textAlign: { md: 'center' }
          }}
          variant={textVariant}
          gutterBottom
        >
          {username}<span style={{ color: '#666' }}>#{props.data.user.identifier.split('#').pop()}</span>
        </Typography>
      </Banner>
      <Paper style={{ marginLeft: '1%', marginRight: '1%', padding: 10, flex: 1 }}>{settings}</Paper>
    </Root>
  )
}

export default Dashboard
