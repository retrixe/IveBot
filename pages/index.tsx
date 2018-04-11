import * as React from 'react'
import { AppBar, Toolbar, Button } from 'material-ui'
import Typography from 'material-ui/Typography'
import Link from 'next/link'

/* eslint-disable quotes, no-multi-str, no-undef */
export default class Index extends React.Component {
  render () {
    return (
      <>
        <link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Roboto:300,400,500' />
        <AppBar>
          <Toolbar>
            <Typography variant='title' color='inherit' style={{ flex: 1 }}>IveBot</Typography>
            <Link href='/dashboard' prefetch><Button color='inherit'>Dashboard</Button></Link>
          </Toolbar>
        </AppBar>
        <br /><br /><br /><br />
        <Typography>
          IveBot is just a Discord bot. A Discord bot that kills other Discord bots.
        </Typography>
      </>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */
