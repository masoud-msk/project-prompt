// <ai_context>
//  Defines MUI theme configurations for light and dark modes,
//  balancing the gold color so it's less eye-catching (slightly darker).
//  Also removing primary color usage for textfield focus outlines.
//  Now ensures html,body,#root have height:100% via CssBaseline.
// </ai_context>

export const lightThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#E6C100', // Slightly toned down gold
    },
    background: {
      default: '#ffffff',
      paper: '#f0f0f0',
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          margin: 0,
          padding: 0,
        },
        '#root': {
          height: '100%',
        },
        /*
          Modern thin scrollbar, autohide on body + any scrollable container
        */
        '*': {
          scrollbarWidth: 'thin' /* for Firefox */,
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
          border: '2px solid transparent', // some spacing around thumb
          backgroundClip: 'content-box',
        },
        '*:hover::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 0.5,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#888 !important',
          },
        },
      },
    },
  },
}

export const darkThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#E6C100',
    },
    background: {
      default: '#181818',
      paper: '#2b2b2b',
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          margin: 0,
          padding: 0,
        },
        '#root': {
          height: '100%',
        },
        /*
          Modern thin scrollbar, autohide on body + any scrollable container
        */
        '*': {
          scrollbarWidth: 'thin' /* for Firefox */,
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          border: '2px solid transparent', // some spacing around thumb
          backgroundClip: 'content-box',
        },
        '*:hover::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 0.5,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#888 !important',
          },
        },
      },
    },
  },
}
