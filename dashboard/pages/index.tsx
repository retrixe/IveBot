import React from 'react'
import { AppBar, Toolbar, Button, Typography, SvgIcon, IconButton } from '@mui/material'
import Head from 'next/head'
import Link from 'next/link'
import type { GetStaticProps } from 'next'
import config from '../imports/config'

const GitHubLogo = (): React.JSX.Element => (
  <SvgIcon>
    <path d='M12.007 0C6.12 0 1.1 4.27.157 10.08c-.944 5.813 2.468 11.45 8.054 13.312.19.064.397.033.555-.084.16-.117.25-.304.244-.5v-2.042c-3.33.735-4.037-1.56-4.037-1.56-.22-.726-.694-1.35-1.334-1.756-1.096-.75.074-.735.074-.735.773.103 1.454.557 1.846 1.23.694 1.21 2.23 1.638 3.45.96.056-.61.327-1.178.766-1.605-2.67-.3-5.462-1.335-5.462-6.002-.02-1.193.42-2.35 1.23-3.226-.327-1.015-.27-2.116.166-3.09 0 0 1.006-.33 3.3 1.23 1.966-.538 4.04-.538 6.003 0 2.295-1.5 3.3-1.23 3.3-1.23.445 1.006.49 2.144.12 3.18.81.877 1.25 2.033 1.23 3.226 0 4.607-2.805 5.627-5.476 5.927.578.583.88 1.386.825 2.206v3.29c-.005.2.092.393.26.507.164.115.377.14.565.063 5.568-1.88 8.956-7.514 8.007-13.313C22.892 4.267 17.884.007 12.008 0z' />
  </SvgIcon>
)

class Index extends React.Component<{ rootUrl: string; clientId: string }, unknown> {
  render(): React.JSX.Element {
    return (
      <div style={{ marginRight: 16, marginLeft: 16 }}>
        <Head>
          <title>IveBot</title>
          <meta property='og:url' content={this.props.rootUrl} />
          <meta property='og:description' content='IveBot is a multi-purpose Discord bot.' />
          <meta name='Description' content='IveBot is a multi-purpose Discord bot.' />
        </Head>
        <AppBar>
          <Toolbar>
            <Typography variant='h6' color='inherit' style={{ flex: 1 }}>
              IveBot
            </Typography>
            <a href='https://github.com/retrixe/IveBot' target='_blank' rel='noopener noreferrer'>
              <IconButton color='default'>
                <GitHubLogo />
              </IconButton>
            </a>
            <Link style={{ textDecoration: 'none', color: 'inherit' }} href='/dashboard'>
              <Button color='inherit'>Dashboard</Button>
            </Link>
          </Toolbar>
        </AppBar>
        <br />
        <br />
        <br />
        <Button
          href={`https://discordapp.com/oauth2/authorize?client_id=${this.props.clientId}&scope=bot&permissions=8`}
          fullWidth
        >
          Add IveBot to your server
        </Button>
        <hr />
        <Typography align='center' variant='h4'>
          IveBot is not just a multipurpose Discord bot.
        </Typography>
        <Typography align='center' variant='h4'>
          It is THE multipurpose Discord bot.
        </Typography>
        <hr />
        <Typography>
          Intended as a Discord bot driven by the community, IveBot is 100% open source and always
          will be.
        </Typography>
        <Typography>
          IveBot also provides an API for other bots to authenticate and communicate with.
        </Typography>
        <hr />
        <Typography>IveBot boasts fast ping and is highly scalable.</Typography>
        <Typography>Also, it's just a pretty good bot that does everything you want.</Typography>
      </div>
    )
  }
}

export const getStaticProps: GetStaticProps = () => {
  return { props: { rootUrl: config.rootUrl ?? '', clientId: config.clientId } }
}

export default Index
