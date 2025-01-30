// <ai_context>
//  Main entry point for the React app. Renders App component into #root.
//  Now uses MUI's ThemeProvider with a custom light/dark theme based on Zustand store.
// </ai_context>

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useThemeStore } from './store'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import { lightThemeOptions, darkThemeOptions } from './muiTheme'

function Root() {
  const themeMode = useThemeStore((state) => state.themeMode)

  const theme = React.useMemo(() => {
    return createTheme(themeMode === 'light' ? lightThemeOptions : darkThemeOptions)
  }, [themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<Root />)