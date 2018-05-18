import * as React from 'react'
import {
  Typography, Paper, List, ListItem, ListItemText, Avatar, Hidden, Divider, IconButton,
  LinearProgress, withWidth
} from '@material-ui/core'
import ArrowBack from '@material-ui/icons/ArrowBack'
import { Query } from 'react-apollo'
import Settings from './settings'
import { gql } from 'apollo-boost'

/* eslint-disable quotes, no-multi-str, no-undef */
interface Props {
  data: Array<{ perms: boolean, icon: string, serverId: string, name: string }>,
  token: string
}
interface State {
  selected: boolean | { perms: boolean, icon: string, serverId: string, name: string }
}
class DashboardIndex extends React.Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {
      selected: false
    }
  }

  render () {
    const query = gql`
query getServerSettings($server: String!, $token: String!) {
  serverSettings(serverId: $server, linkToken: $token) {
    addRoleForAll
    joinAutorole
  }
}
    `
    let settings
    if (!this.state.selected) {
      settings = <List>{this.props.data.map(element => {
        let nameOfServer = element.name ? element.name : ''
        if (nameOfServer.length >= 32) nameOfServer = element.name.substr(0, 29) + '...'
        return (
          <ListItem disabled={!element.perms}
            divider button key={element.serverId} onClick={() => this.setState({ selected: element })}>
            {element.icon === 'no icon'
              ? ''
              : <Avatar src={element.icon} />
            }
            <ListItemText primary={nameOfServer} secondary={element.serverId} />
          </ListItem>
        )
      })}</List>
    } else if (typeof this.state.selected === 'object') {
      const element = this.state.selected
      let nameOfServer = element.name
      if (nameOfServer.length >= 20) nameOfServer = element.name.substr(0, 20) + '...'
      // cap 32
      settings = (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
            <IconButton color='primary' style={{
              marginRight: 10
            }} onClick={() => this.setState({ selected: false })}>
              <ArrowBack />
            </IconButton>
            {element.icon === 'no icon'
              ? ''
              : <Avatar src={`https://cdn.discordapp.com/icons/${element.serverId}/${element.icon}.webp`} />
            }
            <Typography style={{
              marginLeft: 10
            }} variant='title' component='h1'>{nameOfServer} <Hidden mdDown>({element.serverId})</Hidden></Typography>
          </div>
          <Divider />
          <Query query={query} variables={{ server: element.serverId, token: this.props.token }}>
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
              return <Settings data={data.serverSettings} token={this.props.token} server={element.serverId} />
            }}
          </Query>
        </>
      )
    }
    return (
      <>
        <Paper style={{ marginLeft: '2%', marginRight: '2%', padding: 10 }}>
          {settings}
        </Paper>
      </>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */

export default withWidth()(DashboardIndex)
