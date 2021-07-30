import { createTheme } from '@material-ui/core/styles'
import { blue, yellow } from '@material-ui/core/colors'

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: blue,
    secondary: yellow,
    type: 'light'
  }
})

export default theme
