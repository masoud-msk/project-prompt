// <ai_context>
//  A text area for ignore patterns (like .gitignore). Each line is a substring to exclude files/folders.
//  Rewritten with MUI TextField, reduced rows to 2. Examples in placeholder.
// </ai_context>

import React from 'react'
import { TextField } from '@mui/material'
import { useFileStore } from '../store'

export default function IgnoreInput() {
  const { ignorePatterns, setIgnorePatterns } = useFileStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIgnorePatterns(e.target.value)
  }

  return (
    <TextField
      label="Ignore Patterns"
      fullWidth
      multiline
      rows={4}
      value={ignorePatterns}
      onChange={handleChange}
      placeholder={`node_modules
.git
*.log
dist
`}
      variant="outlined"
    />
  )
}
