
// <ai_context>
//  A text area for the user's instructions that will be appended to the final prompt.
//  Includes a "Copy Prompt" button at the bottom to copy the entire prompt content.
// </ai_context>

import { useEffect, useState } from 'react'
import {
  TextField,
  Box,
  Stack,
  FormControlLabel,
  Switch,
  IconButton,
  Button
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useInstructionsStore } from '../store/instructionsStore'
import { useFileStore } from '../store/fileStore'
import { useToastStore } from '../store/toastStore'
import Modal from './modals/Modal'
import PromptGenerator from './PromptGenerator'
import { formatTokenCount } from '../utils/tokenHelpers'

export default function InstructionsField() {
  const { instructions, setInstructions, getFinalPrompt, getFinalPromptTokens } =
    useInstructionsStore()
  const { includeTreeInPrompt, setIncludeTreeInPrompt, loadedFiles } = useFileStore()
  const { showSuccessToast } = useToastStore()

  const [localInstructions, setLocalInstructions] = useState(instructions)

  useEffect(() => {
    setLocalInstructions(instructions)
  }, [instructions])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localInstructions !== instructions) {
        setInstructions(localInstructions)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [localInstructions, instructions, setInstructions])

  const [showPromptModal, setShowPromptModal] = useState(false)
  const handleOpenModal = () => {
    if (localInstructions !== instructions) {
      setInstructions(localInstructions)
    }
    setShowPromptModal(true)
  }
  const handleCloseModal = () => setShowPromptModal(false)

  const handleCopyPrompt = async () => {
    if (localInstructions !== instructions) {
      setInstructions(localInstructions)
    }
    const prompt = getFinalPrompt(loadedFiles, [], includeTreeInPrompt)
    const tokenCount = getFinalPromptTokens(loadedFiles, [], includeTreeInPrompt)

    try {
      await navigator.clipboard.writeText(prompt)
      showSuccessToast(`Copied prompt! ${formatTokenCount(tokenCount)} tokens`)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
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

      <Modal show={showPromptModal} onClose={handleCloseModal}>
        {/* We'll pass needed data to PromptGenerator */}
        <PromptGenerator />
      </Modal>
    </Box>
  )
}
