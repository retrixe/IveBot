import * as React from 'react'
import {
  AppBar, Toolbar, Button, Typography
} from '@material-ui/core'
import Link from 'next/link'
import { request } from 'graphql-request'
import withRoot from '../components/withRoot'

// Apollo Client definition.
/* eslint-disable quotes, no-multi-str, no-undef */
class Index extends React.Component {
  state = { id: '' }

  componentDidMount () {
    request('/graphql', `{
  getBotId
}`
    ).then((data: { getBotId: string }) => this.setState({ id: data.getBotId }))
  }

  render () {
    return (
      <div style={{ marginRight: 16, marginLeft: 16 }}>
        <AppBar>
          <Toolbar>
            <Typography variant='title' color='inherit' style={{ flex: 1 }}>IveBot</Typography>
            <Link prefetch href='/dashboard'><Button color='inherit'>Dashboard</Button></Link>
          </Toolbar>
        </AppBar>
        <br /><br /><br /><br />
        <Button href={
          `https://discordapp.com/oauth2/authorize?client_id=${this.state.id}&scope=bot&permissions=8`
        } fullWidth>Add IveBot to your server</Button>
        <hr />
        <Typography align='center' variant='display1'>
IveBot is not just a multipurpose Discord bot.
        </Typography>
        <Typography align='center' variant='display1'>
It is THE multipurpose Discord bot.
        </Typography>
        <hr />
        <Typography>Intended as a Discord bot driven by the community,
IveBot is 100% open source and always will be.</Typography>
        <Typography>IveBot also provides an API for other bots to authenticate
          and communicate with.
        </Typography>
        <hr />
        <Typography>IveBot boasts fast ping and is highly scalable.</Typography>
        <Typography>Also, {'it\'s'} just a pretty good bot.</Typography>
      </div>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */

export default withRoot(Index)
