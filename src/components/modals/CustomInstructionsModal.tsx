
// <ai_context>
//  A modal for creating/editing custom instructions. Allows adding new instructions,
//  editing existing ones, and removing them if needed. All stored in localStorage via the store.
// </ai_context>

import { useState } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Stack,
  Typography,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { styled } from '@mui/material/styles'
import { useCustomInstructionsStore } from '../../store/customInstructionsStore'
import { approximateTokens, formatTokenCount } from '../../utils/tokenHelpers'

interface Props {
  open: boolean
  onClose: () => void
}

const StyledDialogTitle = styled(DialogTitle)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}))

const ModalContent = styled(Box)(() => ({
  paddingLeft: 24,
  paddingRight: 24,
  paddingBottom: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: '400px',
  maxHeight: '70vh'
}))

export default function CustomInstructionsModal({ open, onClose }: Props) {
  const {
    customInstructions,
    addCustomInstruction,
    updateCustomInstruction,
    removeCustomInstruction
  } = useCustomInstructionsStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [nameValue, setNameValue] = useState('')
  const [contentValue, setContentValue] = useState('')

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setIsEditing(false)
    setEditId(null)
    setNameValue('')
    setContentValue('')
  }

  const handleSubmit = () => {
    if (!nameValue.trim() || !contentValue.trim()) return

    if (isEditing && editId) {
      updateCustomInstruction(editId, nameValue, contentValue)
    } else {
      addCustomInstruction(nameValue, contentValue)
    }
    resetForm()
  }

  const handleEdit = (id: string, name: string, content: string) => {
    setIsEditing(true)
    setEditId(id)
    setNameValue(name)
    setContentValue(content)
  }

  const handleDelete = (id: string) => {
    removeCustomInstruction(id)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        Manage Custom Instructions
        <Tooltip title="Close">
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </StyledDialogTitle>

      <ModalContent>
        {/* Existing Instructions */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 0
          }}
        >
          {customInstructions.length === 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              No custom instructions yet.
            </Typography>
          )}
          {customInstructions.length > 0 && (
            <List dense sx={{ px: 2 }}>
              {customInstructions.map(ci => {
                const tokenCount = approximateTokens(ci.content)
                const displayName = `${ci.name} (${formatTokenCount(tokenCount)} T)`

                return (
                  <ListItem key={ci.id} disableGutters>
                    <ListItemText
                      primary={displayName}
                      secondary={
                        ci.content.length > 50
                          ? ci.content.slice(0, 50) + '...'
                          : ci.content
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Edit instruction">
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEdit(ci.id, ci.name, ci.content)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete instruction">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(ci.id)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>

        {/* Create/Edit Form */}
        <Stack direction="column" gap={1}>
          <TextField
            label="Instruction Name"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            variant="outlined"
            size="small"
          />
          <TextField
            label="Instruction Content"
            value={contentValue}
            onChange={e => setContentValue(e.target.value)}
            variant="outlined"
            multiline
            rows={5}
          />
          <Button variant="contained" onClick={handleSubmit}>
            {isEditing ? 'Update Instruction' : 'Add Instruction'}
          </Button>
        </Stack>
      </ModalContent>
    </Dialog>
  )
}
