// <ai_context>
//  A text area for the user's instructions that will be appended to the final prompt.
//  Now includes a "Copy Prompt" button at the bottom to copy the entire prompt content
//  without opening the prompt modal.
// </ai_context>

import React, { useState } from 'react'
import { TextField, Box, Button, Stack, FormControlLabel, Switch } from '@mui/material'
import { useFileStore } from '../store'
import { approximateTokens, formatTokenCount } from '../utils/tokenHelpers'

// Reuse the buildLoadedFilesTreeText function from PromptGenerator or replicate here
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

export default function InstructionsField() {
  const {
    instructions,
    setInstructions,
    loadedFiles,
    customInstructions,
    includeTreeInPrompt,
    setIncludeTreeInPrompt
  } = useFileStore()

  const [copied, setCopied] = useState(false)
  const [copiedTokens, setCopiedTokens] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstructions(e.target.value)
  }

  // Build final prompt: main instructions + active custom instructions + file contents + optional tree
  const generatePrompt = (): string => {
    const activeCustoms = customInstructions.filter(ci => ci.isActive)

    let final = instructions
    if (activeCustoms.length > 0) {
      final += '\n\n' + activeCustoms.map(ci => ci.content).join('\n\n')
    }
    if (loadedFiles.length > 0) {
      final +=
        '\n\n' +
        loadedFiles
          .map(file => `---\nFile: ${file.path}\n${file.content}`)
          .join('\n\n')
    }
    if (includeTreeInPrompt && loadedFiles.length > 0) {
      const treeText = buildLoadedFilesTreeText(loadedFiles)
      if (treeText.trim()) {
        final += '\n\nLOADED FILES TREE:\n' + treeText
      }
    }

    return final
  }

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt()
    const tokenCount = approximateTokens(prompt)

    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setCopiedTokens(tokenCount)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const copyButtonText = copied
    ? `Copied! (${formatTokenCount(copiedTokens)} tokens)`
    : 'Copy Prompt'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* MAIN INSTRUCTIONS TEXT FIELD */}
      <TextField
        label="Instructions"
        fullWidth
        multiline
        rows={6}
        value={instructions}
        onChange={handleChange}
        placeholder="Add your instructions here..."
        variant="outlined"
      />

      {/* Row: Switch + Copy Prompt Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={includeTreeInPrompt}
              onChange={(e) => setIncludeTreeInPrompt(e.target.checked)}
            />
          }
          label="Add files tree structure"
        />

        <Button variant="contained" color="primary" onClick={handleCopyPrompt}>
          {copyButtonText}
        </Button>
      </Stack>
    </Box>
  )
}