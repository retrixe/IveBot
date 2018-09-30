import * as React from 'react'
import {
  AppBar, Toolbar, Button, DialogTitle, DialogActions, DialogContent, DialogContentText, Dialog,
  Typography, TextField, LinearProgress
} from '@material-ui/core'
import Link from 'next/link'
import ApolloClient, { gql } from 'apollo-boost'
import { ApolloProvider, Query } from 'react-apollo'
import Dashboard from '../components/dashboard'
import withRoot from '../components/withRoot'

// Apollo Client definition.
const client = new ApolloClient({ uri: `/graphql` })

/* eslint-disable quotes, no-multi-str, no-undef */
class DashboardIndex extends React.Component {
  state = { open: false, token: '' }
  openDialog = () => this.setState({ open: true })
  closeDialog = () => this.setState({ open: false })
  render () {
    const query = gql`
query getAllCommonServers($token: String!) {
  getUserInfo(linkToken: $token) {
    serverId
    name
    perms
    icon
  }
}
    `
    return (
      <ApolloProvider client={client}>
      <>
        {/* login dialog. */}
        <Dialog open={this.state.open} onClose={this.closeDialog}>
          <DialogTitle>Log In</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter your link token here, retrievable through /token on Discord.
            </DialogContentText>
            <TextField onChange={(e) => this.setState({ token: e.target.value })}
              autoFocus margin='dense' label='Link Token' type='password' fullWidth
              value={this.state.token} required />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.closeDialog} color='primary'>Cancel</Button>
            <Button onClick={this.closeDialog} color='primary'>Log In</Button>
          </DialogActions>
        </Dialog>
        {/* actual code starts here. */}
        <AppBar>
          <Toolbar>
            <Typography variant='title' color='inherit' style={{ flex: 1 }}>IveBot</Typography>
            <Link prefetch href='/'><Button color='inherit'>Home</Button></Link>
            {this.state.token.length === 6 && !this.state.open
              ? <Button color='inherit' onClick={() => this.setState({ token: '' })}>Logout</Button>
              : <Button color='inherit' onClick={this.openDialog}>Login</Button>
            }
          </Toolbar>
        </AppBar>
        <br /><br /><br /><br />
        <div style={{ padding: 10 }}>
          {this.state.token.length === 6 && !this.state.open
            ? <Query query={query} variables={{ token: this.state.token }}>
              {({ loading, error, data }) => {
                if (error) {
                  return (
                    <Typography color='error'>
                      Could not fetch data. Refresh the page and try again.
                      <br />
                      {`${error}`}
                    </Typography>
                  )
                }
                if (loading || !data) return <LinearProgress color='secondary' variant='query' />
                return <Dashboard data={data.getUserInfo} token={this.state.token} />
              }}
            </Query>
            : <Typography align='center'
            >Log into the dashboard through the button in the upper right corner.</Typography>
          }
        </div>
      </>
      </ApolloProvider>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */

export default withRoot(DashboardIndex)
