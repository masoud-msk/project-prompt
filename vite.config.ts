// <ai_context>
//  Vite configuration file for React project with plugin-react.
// </ai_context>

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: 'project-prompt',
})
