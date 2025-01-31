// <ai_context>
//  Displays the final combined prompt: instructions + contents of all loaded files.
//  Also shows total tokens (instructions + loaded files).
//  Now reintroduces a Copy button to copy the entire result prompt.
// </ai_context>

import React, { useState } from 'react'
import { TextField, Typography, Box, Button } from '@mui/material'
import { useFileStore } from '../store'
import { formatTokenCount } from '../utils/tokenHelpers'

export default function PromptGenerator() {
  const { getFinalPrompt, getFinalPromptTokens } = useFileStore()

  const promptValue = getFinalPrompt()
  const totalTokens = getFinalPromptTokens()

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Total tokens: {formatTokenCount(totalTokens)}
        </Typography>
        <Button variant="contained" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </Box>

      <TextField
        multiline
        rows={13}
        fullWidth
        variant="outlined"
        value={promptValue}
        InputProps={{
          readOnly: true,
        }}
      />
    </Box>
  )
}
