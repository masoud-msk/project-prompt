// <ai_context>
//  A text area for the user's instructions that will be appended to the final prompt.
//  Now includes a "Copy Prompt" button at the bottom to copy the entire prompt content
//  without opening the prompt modal.
// </ai_context>

import { useEffect, useState } from 'react'
import {
  TextField,
  Box,
  Stack,
  FormControlLabel,
  Switch,
  IconButton,
  Button,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useFileStore } from '../store'
import Modal from './Modal'
import PromptGenerator from './PromptGenerator'

export default function InstructionsField() {
  const {
    instructions,
    setInstructions,
    loadedFiles,
    customInstructions,
    includeTreeInPrompt,
    setIncludeTreeInPrompt,
    getFinalPrompt,
    getFinalPromptTokens,
    showSuccessToast,
  } = useFileStore()

  // Local state for instructions (debounced update)
  const [localInstructions, setLocalInstructions] = useState(instructions)
  useEffect(() => {
    setLocalInstructions(instructions)
  }, [instructions])

  useEffect(() => {
    const timer = setTimeout(() => {
      // Update global store after 500ms
      if (localInstructions !== instructions) {
        setInstructions(localInstructions)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [localInstructions, instructions, setInstructions])

  // Show prompt modal
  const [showPromptModal, setShowPromptModal] = useState(false)
  const handleOpenModal = () => setShowPromptModal(true)
  const handleCloseModal = () => setShowPromptModal(false)

  // Copy prompt
  const handleCopyPrompt = async () => {
    const prompt = getFinalPrompt()
    const tokenCount = getFinalPromptTokens()

    try {
      await navigator.clipboard.writeText(prompt)
      showSuccessToast(`Copied prompt! (${tokenCount} tokens)`)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* MAIN INSTRUCTIONS TEXT FIELD */}
      <TextField
        label="Instructions"
        fullWidth
        multiline
        rows={6}
        value={localInstructions}
        onChange={e => setLocalInstructions(e.target.value)}
        placeholder="Add your instructions here..."
        variant="outlined"
      />

      {/* Row: Switch + Copy Prompt Button + Show Prompt Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={includeTreeInPrompt}
              onChange={e => setIncludeTreeInPrompt(e.target.checked)}
            />
          }
          label="Add files tree structure"
        />

        <Stack direction="row" spacing={1}>
          <IconButton color="inherit" onClick={handleCopyPrompt}>
            <ContentCopyIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<VisibilityIcon />}
            onClick={handleOpenModal}
          >
            Full Prompt
          </Button>
        </Stack>
      </Stack>

      {/* Prompt Modal */}
      <Modal show={showPromptModal} onClose={handleCloseModal}>
        <PromptGenerator />
      </Modal>
    </Box>
  )
}
