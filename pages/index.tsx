import * as React from 'react'
import { AppBar, Toolbar, Button } from 'material-ui'
import Typography from 'material-ui/Typography'
import Link from 'next/link'
import withRoot from '../components/withRoot'

/* eslint-disable quotes, no-multi-str, no-undef */
class Index extends React.Component {
  render () {
    return (
      <>
        <AppBar>
          <Toolbar>
            <Typography variant='title' color='inherit' style={{ flex: 1 }}>IveBot</Typography>
            <Link href='/dashboard' prefetch><Button color='inherit'>Dashboard</Button></Link>
          </Toolbar>
        </AppBar>
        <br /><br /><br /><br />
        <div style={{ padding: 10 }}>
          <Typography>
            IveBot is just a Discord bot. A Discord bot that kills other Discord bots.
          </Typography>
        </div>
      </>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */

export default withRoot(Index)
