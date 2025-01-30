// <ai_context>
//  A text area for the user's instructions that will be appended to the final prompt.
//  Now includes a "Copy Prompt" button at the bottom to copy the entire prompt content
//  without opening the prompt modal.
// </ai_context>

import React, { useState } from 'react'
import {
  TextField,
  Box,
  Button,
  Stack,
  Paper,
  Tooltip,
  IconButton,
  Switch,
  Typography
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import { useFileStore } from '../store'
import { approximateTokens } from '../utils/tokenHelpers'
import CustomInstructionsModal from './CustomInstructionsModal'

export default function InstructionsField() {
  const {
    instructions,
    setInstructions,
    loadedFiles,
    customInstructions,
    toggleCustomInstruction
  } = useFileStore()

  const [copied, setCopied] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstructions(e.target.value)
  }

  // Build final prompt: main instructions + active custom instructions + file contents
  const generatePrompt = (): string => {
    // Gather active custom instructions
    const activeCustoms = customInstructions.filter(ci => ci.isActive)

    let final = instructions
    if (activeCustoms.length > 0) {
      final += '\n\n' + activeCustoms.map(ci => ci.content).join('\n\n')
    }
    if (loadedFiles.length > 0) {
      final +=
        '\n\n' +
        loadedFiles
          .map((file) => `---\nFile: ${file.path}\n${file.content}`)
          .join('\n\n')
    }
    return final
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatePrompt())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const handleOpenModal = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* STORED INSTRUCTIONS BAR (Horizontally scrollable) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto' }}>
        {customInstructions.map((ci) => (
          <Tooltip
            key={ci.id}
            title={ci.content.length > 50 ? ci.content.slice(0, 50) + '...' : ci.content}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                minWidth: 'max-content'
              }}
            >
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 600 }}>
                {ci.name}
              </Typography>
              <Switch
                size="small"
                color="primary"
                checked={ci.isActive}
                onChange={() => toggleCustomInstruction(ci.id)}
              />
            </Paper>
          </Tooltip>
        ))}

        {/* Manage Instructions Icon */}
        <IconButton onClick={handleOpenModal} sx={{ ml: 'auto' }}>
          <SettingsIcon />
        </IconButton>
      </Box>

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

      {/* COPY PROMPT BUTTON */}
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={handleCopyPrompt}>
          {copied ? 'Copied!' : 'Copy Prompt'}
        </Button>
      </Stack>

      {/* Manage Custom Instructions Modal */}
      <CustomInstructionsModal open={modalOpen} onClose={handleCloseModal} />
    </Box>
  )
}