// <ai_context>
//  Displays the final combined prompt: instructions + contents of all loaded files.
//  Also shows total tokens (instructions + loaded files).
//  Now reintroduces a Copy button to copy the entire result prompt.
// </ai_context>

import React, { useState } from 'react'
import { TextField, Typography, Box, Button } from '@mui/material'
import { useFileStore } from '../store'
import { approximateTokens } from '../utils/tokenHelpers'

export default function PromptGenerator() {
  const { instructions, loadedFiles, customInstructions } = useFileStore()

  // Sum tokens for instructions:
  const instructionsTokens = approximateTokens(instructions)

  // Sum tokens for active custom instructions:
  const activeCustoms = customInstructions.filter(ci => ci.isActive)
  const customInstructionsTokens = activeCustoms.reduce((acc, ci) => acc + approximateTokens(ci.content), 0)

  // Sum tokens for loaded files:
  const fileTokens = loadedFiles.reduce((acc, f) => acc + f.tokenCount, 0)

  // Total
  const totalTokens = instructionsTokens + customInstructionsTokens + fileTokens

  const [copied, setCopied] = useState(false)

  // Generate final prompt: main instructions + active custom instructions + loaded files
  const generatePrompt = (): string => {
    let result = instructions
    if (activeCustoms.length > 0) {
      result += '\n\n' + activeCustoms.map(ci => ci.content).join('\n\n')
    }
    if (loadedFiles.length > 0) {
      result +=
        '\n\n' +
        loadedFiles
          .map((file) => `---\nFile: ${file.path}\n${file.content}`)
          .join('\n\n')
    }
    return result
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatePrompt())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  const promptValue = generatePrompt()

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Total tokens: {totalTokens}
        </Typography>
        <Button variant="contained" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </Box>
      <TextField
        multiline
        rows={10}
        fullWidth
        variant="outlined"
        value={promptValue}
        InputProps={{
          readOnly: true
        }}
      />
    </Box>
  )
}