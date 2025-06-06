import React from 'react'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import { ApolloProvider } from '@apollo/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter'
import { useApollo } from '../imports/client/apolloClient'
import theme from '../imports/client/theme'

interface MyAppProps extends AppProps {
  pageProps: Record<string, unknown>
}

export default function MyApp(props: MyAppProps): React.JSX.Element {
  const { Component, pageProps } = props

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')
    jssStyles?.parentElement?.removeChild(jssStyles)
  }, [])

  return (
    <AppCacheProvider {...props}>
      <Head>
        <title>IveBot</title>
        <meta name='viewport' content='initial-scale=1, width=device-width' />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <ApolloProvider client={useApollo(pageProps)}>
          <Component {...pageProps} />
        </ApolloProvider>
      </ThemeProvider>
    </AppCacheProvider>
  )
}
