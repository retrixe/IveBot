import React from 'react'
import {
  AppBar, Toolbar, Button, Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText,
  Typography, TextField, LinearProgress
} from '@material-ui/core'
import Head from 'next/head'
import Link from 'next/link'
import Dashboard from '../imports/dashboard'
import ApolloClient, { gql, OperationVariables } from 'apollo-boost'
import { ApolloProvider, Query, QueryResult } from 'react-apollo'
import { ServerInfo } from '../imports/graphqlTypes'

// Apollo Client definition.
const client = new ApolloClient({ uri: '/api/graphql', fetchOptions: { fetch } })
const rootURL = 'https://ivebot.now.sh' // Modify when self-hosting.

class DashboardIndex extends React.Component {
  state = { open: false, token: '' }
  handleOpenDialog = () => this.setState({ open: true })
  handleCloseDialog = () => this.setState({ open: false })
  render () {
    const query = gql`
query getAllCommonServers($token: String!) {
  getUserInfo(linkToken: $token) {
    serverId
    name
    perms
    icon
    channels {
      id
      name
    }
  }
}
    `
    return (
      <ApolloProvider client={client}>
        <>
          <Head>
            <title>IveBot</title>
            <meta property='og:url' content={`${rootURL}/dashboard`} />
            <meta property='og:description' content={'IveBot\'s dashboard for managing settings.'} />
            <meta name='Description' content={'IveBot\'s dashboard for managing settings.'} />
          </Head>
          {/* login dialog. */}
          <Dialog open={this.state.open} onClose={this.handleCloseDialog}>
            <DialogTitle>Log In</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Enter your link token here, retrievable through /token on Discord.
              </DialogContentText>
              <TextField
                onChange={(e) => this.setState({ token: e.target.value })}
                autoFocus margin='dense' label='Link Token' type='password' fullWidth
                value={this.state.token} required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleCloseDialog} color='primary'>Cancel</Button>
              <Button onClick={this.handleCloseDialog} color='primary'>Log In</Button>
            </DialogActions>
          </Dialog>
          {/* actual code starts here. */}
          <AppBar>
            <Toolbar>
              <Typography variant='h6' color='inherit' style={{ flex: 1 }}>IveBot</Typography>
              <Link prefetch href='/'><Button color='inherit'>Home</Button></Link>
              {this.state.token.length === 6 && !this.state.open
                ? <Button color='inherit' onClick={() => this.setState({ token: '' })}>Logout</Button>
                : <Button color='inherit' onClick={this.handleOpenDialog}>Login</Button>}
            </Toolbar>
          </AppBar>
          <br /><br /><br /><br />
          <div style={{ padding: 10 }}>
            {this.state.token.length === 6 && !this.state.open
              ? (
                <Query query={query} variables={{ token: this.state.token }}>
                  {({ loading, error, data }: QueryResult<{ getUserInfo: ServerInfo[] }, OperationVariables>) => {
                    if (error != null) {
                      return (
                        <Typography color='error'>
                          Could not fetch data. Refresh the page and try again.
                          <br />
                          {error.message}
                        </Typography>
                      )
                    }
                    if (loading || (data == null)) return <LinearProgress color='secondary' variant='query' />
                    return <Dashboard data={data.getUserInfo} token={this.state.token} />
                  }}
                </Query>
                )
              : (
                <Typography align='center'>Log into the dashboard through the button in the upper right corner.
                </Typography>
                )}
          </div>
        </>
      </ApolloProvider>
    )
  }
}

export default DashboardIndex
