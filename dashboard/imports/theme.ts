import { createTheme } from '@mui/material/styles'
import { blue, yellow } from '@mui/material/colors'

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: blue,
    secondary: yellow,
    mode: 'light'
  }
})

export default theme
