import React from 'react'
import { AppBar, Toolbar, Button, Typography, LinearProgress } from '@mui/material'
import { useQuery, gql } from '@apollo/client'
import Head from 'next/head'
import Link from 'next/link'
import Dashboard from '../imports/client/dashboard'
import type { DiscordUser, ServerInfo } from '../imports/graphqlTypes'
import type { GetStaticProps } from 'next'
import config from '../imports/config'

const GET_USER_DATA = gql`
  query GetUserData {
    user: getUserInfo {
      identifier
      avatar
    }
    servers: getUserServers {
      id
      name
      icon
      perms
      channels {
        id
        name
      }
    }
  }
`

const DashboardPage = (props: { rootUrl: string }): React.JSX.Element => {
  const { loading, error, data } = useQuery<{
    servers: ServerInfo[]
    user: Omit<DiscordUser, 'id'>
  }>(GET_USER_DATA)

  const loggedOut = error?.graphQLErrors[0]?.extensions?.code === 'UNAUTHENTICATED'
  const loginWithOauth = (): void => {
    if (loggedOut) window.location.pathname = '/api/oauth'
  }
  const logout = () => {
    fetch('/api/logout', { method: 'POST' })
      .then(res => {
        if (res.ok) window.location.reload()
      })
      .catch(console.error)
  }

  return (
    <>
      <Head>
        <title>IveBot</title>
        <meta property='og:url' content={`${props.rootUrl}/dashboard`} />
        <meta property='og:description' content="IveBot's dashboard for managing settings." />
        <meta name='Description' content="IveBot's dashboard for managing settings." />
      </Head>
      <AppBar>
        <Toolbar>
          <Typography variant='h6' color='inherit' style={{ flex: 1 }}>
            IveBot
          </Typography>
          <Link style={{ textDecoration: 'none', color: 'inherit' }} href='/'>
            <Button color='inherit'>Home</Button>
          </Link>
          {loggedOut ? (
            <Button color='inherit' onClick={loginWithOauth}>
              Login
            </Button>
          ) : (
            <Button color='inherit' onClick={logout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <br />
      <br />
      <br />
      <div style={{ padding: 10 }}>
        {loggedOut ? (
          <Typography align='center'>
            Click the button in the top-right corner to login via Discord.
          </Typography>
        ) : error ? (
          <Typography color='error'>
            Could not fetch data from the server! Refresh the page and try again.
            <br />
            {error.message}
          </Typography>
        ) : loading || !data ? (
          <LinearProgress color='secondary' variant='query' />
        ) : (
          <Dashboard data={data} />
        )}
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = () => {
  return { props: { rootUrl: config.rootUrl ?? '' } }
}

export default DashboardPage
