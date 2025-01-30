// <ai_context>
//  Displays the final combined prompt: instructions + contents of all loaded files.
//  Also shows total tokens (instructions + loaded files).
//  Now reintroduces a Copy button to copy the entire result prompt.
// </ai_context>

import React, { useState } from 'react'
import { TextField, Typography, Box, Button } from '@mui/material'
import { useFileStore } from '../store'
import { approximateTokens, formatTokenCount } from '../utils/tokenHelpers'

export default function PromptGenerator() {
  const {
    instructions,
    loadedFiles,
    customInstructions,
    includeTreeInPrompt
  } = useFileStore()

  // Sum tokens for instructions:
  const instructionsTokens = approximateTokens(instructions)

  // Sum tokens for active custom instructions:
  const activeCustoms = customInstructions.filter(ci => ci.isActive)
  const customInstructionsTokens = activeCustoms.reduce(
    (acc, ci) => acc + approximateTokens(ci.content),
    0
  )

  // Sum tokens for loaded files:
  const fileTokens = loadedFiles.reduce((acc, f) => acc + f.tokenCount, 0)

  // Build optional file tree text if needed
  const fileTreeText = includeTreeInPrompt ? buildLoadedFilesTreeText(loadedFiles) : ''
  const fileTreeTokens = includeTreeInPrompt ? approximateTokens(fileTreeText) : 0

  // Total
  const totalTokens = instructionsTokens + customInstructionsTokens + fileTokens + fileTreeTokens

  const [copied, setCopied] = useState(false)

  // Generate final prompt: main instructions + active custom instructions + loaded files + optional tree
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
    if (includeTreeInPrompt && fileTreeText) {
      result += '\n\nLOADED FILES TREE:\n' + fileTreeText
    }

    return result
  }

  const promptValue = generatePrompt()

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
          mb: 1
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

/**
 * Build a textual tree representation for loaded files.
 * E.g. for paths: "src/components/A.tsx", "src/utils/B.ts"
 */
function buildLoadedFilesTreeText(files: { path: string }[]): string {
  if (!files.length) return ''

  // Create a nested structure
  const root: Record<string, any> = {}

  for (const f of files) {
    const segments = f.path.split('/')
    let current = root
    for (const seg of segments) {
      if (!current[seg]) {
        current[seg] = {}
      }
      current = current[seg]
    }
  }

  // Recursively print
  function printTree(node: Record<string, any>, prefix: string): string {
    const lines: string[] = []
    const keys = Object.keys(node).sort()
    for (const k of keys) {
      lines.push(prefix + k)
      const sub = node[k]
      if (Object.keys(sub).length > 0) {
        lines.push(printTree(sub, prefix + '  '))
      }
    }
    return lines.join('\n')
  }

  return printTree(root, '')
}