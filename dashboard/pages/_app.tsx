import React from 'react'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import { ApolloProvider } from '@apollo/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider, type EmotionCache } from '@emotion/react'
import createCache from '@emotion/cache'
import { useApollo } from '../imports/apolloClient'
import theme from '../imports/theme'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createCache({ key: 'css' })

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}

export default function MyApp(props: MyAppProps): React.JSX.Element {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')
    jssStyles?.parentElement?.removeChild(jssStyles)
  }, [])

  return (
    <CacheProvider value={emotionCache}>
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
    </CacheProvider>
  )
}
