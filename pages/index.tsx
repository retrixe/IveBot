import * as React from 'react'
import { AppBar, Toolbar } from 'material-ui'
import Typography from 'material-ui/Typography'

/* eslint-disable quotes, no-multi-str */
const Index = () => (
  <>
    <AppBar>
      <Toolbar>
        <Typography variant='title' color='inherit'>IveBot</Typography>
      </Toolbar>
    </AppBar>
    <br /><br /><br /><br />
    <Typography>
      IveBot is just a Discord bot. A Discord bot that kills other Discord bots.
    </Typography>
  </>
)
/* eslint-enable quotes, no-multi-str */

export default Index
