import React from 'react'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import createEmotionServer from '@emotion/server/create-instance'
import createCache from '@emotion/cache'
import theme from '../imports/theme'

const ico =
  'https://cdn.discordapp.com/avatars/383591525944262656/7b826edf3e6dcb47dbbb1131aaf72710.jpg'

class MyDocument extends Document {
  render(): React.JSX.Element {
    return (
      <Html lang='en' dir='ltr'>
        <Head>
          <link rel='icon' href={ico} />
          <meta charSet='utf-8' />
          {/* PWA primary color */}
          <meta name='theme-color' content={theme.palette.primary.main} />
          {/* Open Graph Protocol support. */}
          <meta property='og:title' content='IveBot' />
          <meta property='og:type' content='website' />
          <meta property='og:image' content={ico} />
          <link
            rel='stylesheet'
            href='https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=optional'
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

MyDocument.getInitialProps = async ctx => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  const originalRenderPage = ctx.renderPage

  // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createCache({ key: 'css' })
  const emotionServer = createEmotionServer(cache as any)

  ctx.renderPage = async () =>
    await originalRenderPage({
      enhanceApp: (App: any) => {
        const EnhancedApp = (props: any): React.JSX.Element => (
          <App emotionCache={cache} {...props} />
        )
        return EnhancedApp
      },
    })

  const initialProps = await Document.getInitialProps(ctx)
  // This is important. It prevents emotion to render invalid HTML.
  // See https://github.com/mui-org/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = emotionServer.extractCriticalToChunks(initialProps.html)
  const emotionStyleTags = emotionStyles.styles.map(style => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ))

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [...React.Children.toArray(initialProps.styles), ...emotionStyleTags],
  }
}

export default MyDocument
