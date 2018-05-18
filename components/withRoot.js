import React from 'react'
import { CssBaseline, MuiThemeProvider } from '@material-ui/core'
import getPageContext from './getPageContext'
import PropTypes from 'prop-types'

function withRoot (Component) {
  class WithRoot extends React.Component {
    constructor (props, context) {
      super(props, context)

      this.pageContext = this.props.pageContext || getPageContext()
    }

    componentDidMount () {
      // Remove the server-side injected CSS.
      const jssStyles = document.querySelector('#jss-server-side')
      if (jssStyles && jssStyles.parentNode) {
        jssStyles.parentNode.removeChild(jssStyles)
      }
    }

    pageContext = null // eslint-disable-line no-undef

    render () {
      // MuiThemeProvider makes the theme available down the React tree thanks to React context.
      return (
        <MuiThemeProvider
          theme={this.pageContext.theme}
          sheetsManager={this.pageContext.sheetsManager}
        >
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <Component {...this.props} />
        </MuiThemeProvider>
      )
    }
  }

  WithRoot.getInitialProps = ctx => {
    if (Component.getInitialProps) {
      return Component.getInitialProps(ctx)
    }

    return {}
  }

  WithRoot.propTypes = { pageContext: PropTypes.object }

  return WithRoot
}

export default withRoot
