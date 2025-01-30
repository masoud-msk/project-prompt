// <ai_context>
//  Defines MUI theme configurations for light and dark modes,
//  balancing the gold color so it's less eye-catching (slightly darker).
//  Also removing primary color usage for textfield focus outlines.
// </ai_context>

import { createTheme } from '@mui/material/styles'

export const lightThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      // Slightly toned down gold
      main: '#E6C100'
    },
    background: {
      default: '#ffffff',
      paper: '#f0f0f0'
    }
  },
  shape: {
    borderRadius: 6
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // Override the focus border color
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#888 !important'
          }
        }
      }
    }
  }
}

export const darkThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#E6C100' // toned down gold for dark mode as well
    },
    background: {
      default: '#181818',
      paper: '#2b2b2b'
    }
  },
  shape: {
    borderRadius: 6
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // Override the focus border color
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#888 !important'
          }
        }
      }
    }
  }
}