import React from 'react'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import {
  DocumentHeadTags,
  type DocumentHeadTagsProps,
  documentGetInitialProps,
} from '@mui/material-nextjs/v15-pagesRouter'
import theme from '../imports/client/theme'

const ico =
  'https://cdn.discordapp.com/avatars/383591525944262656/7b826edf3e6dcb47dbbb1131aaf72710.jpg'

class MyDocument extends Document<DocumentHeadTagsProps> {
  render(): React.JSX.Element {
    return (
      <Html lang='en' dir='ltr'>
        <Head>
          <DocumentHeadTags {...this.props} />
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
  const finalProps = await documentGetInitialProps(ctx)
  return finalProps
}

export default MyDocument
