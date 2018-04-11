import * as React from 'react'
import { AppBar, Toolbar, Button } from 'material-ui'
import Dialog, { DialogTitle, DialogActions, DialogContent, DialogContentText } from 'material-ui/Dialog'
import Typography from 'material-ui/Typography'
import TextField from 'material-ui/TextField'
import Link from 'next/link'
import ApolloClient, { gql } from 'apollo-boost'
import { ApolloProvider, Query } from 'react-apollo'
import Dashboard from '../client'

// Apollo Client definition.
const { protocol, host } = window.location
const client = new ApolloClient({ uri: `${protocol}//${host}/graphql` })

/* eslint-disable quotes, no-multi-str, no-undef */
export default class DashboardIndex extends React.Component {
  state = { open: false, token: '' }
  openDialog = () => this.setState({ open: true })
  closeDialog = () => this.setState({ open: false })
  query = gql`
{
  getLinkUser(linkToken:"$token") {
    serverId
    name
    perms
    icon
  }
}

  `
  render () {
    return (
      <ApolloProvider client={client}>
      <>
        <link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Roboto:300,400,500' />
        <Dialog open={this.state.open} onClose={this.closeDialog}>
          <DialogTitle>Log In</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter your link token here, retrievable through /link on Discord.
            </DialogContentText>
            <TextField onChange={(e) => this.setState({ token: e.target.value })}
              autoFocus margin='dense' label='Link Token' type='password' fullWidth
              value={this.state.token} />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.closeDialog} color='primary'>
              Cancel
            </Button>
            <Button onClick={this.closeDialog} color='primary'>
              Log In
            </Button>
          </DialogActions>
        </Dialog>
        <AppBar>
          <Toolbar>
            <Typography variant='title' color='inherit' style={{ flex: 1 }}>IveBot</Typography>
            <Link prefetch href='/'><Button color='inherit'>Home</Button></Link>
            <Button color='inherit' onClick={this.openDialog}>Login</Button>
          </Toolbar>
        </AppBar>
        <br /><br /><br /><br />
        <Query query={this.query} variables={{ token: this.state.token }}>
          {({ loading, error, data }) => {
            if (error && this.state.token) {
              return (
                <Typography color='error'>
                  Could not fetch data. You may have entered a wrong token.
                  Refresh the page and try again.
                  <br />
                  {`${error}`}
                </Typography>
              )
            } else if (error) {
              return (
                <Typography>Log in through the upper-right corner.</Typography>
              )
            }
            if (loading || !data) return <Typography>Fetching data...</Typography>
            return <Dashboard data={data.getLinkUser} />
          }}
        </Query>
      </>
      </ApolloProvider>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */
