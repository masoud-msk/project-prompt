// <ai_context>
//  A modal for creating/editing custom instructions. Allows adding new instructions,
//  editing existing ones, and removing them if needed. All stored in localStorage via the store.
// </ai_context>

import React, { useState } from 'react'
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
  Tooltip,
  Stack,
  Typography,
  ListItemSecondaryAction
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useFileStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CustomInstructionsModal({ open, onClose }: Props) {
  const {
    customInstructions,
    addCustomInstruction,
    updateCustomInstruction,
    removeCustomInstruction
  } = useFileStore()

  // For new or editing
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
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Manage Custom Instructions
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Existing Instructions */}
        {customInstructions.length === 0 && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            No custom instructions yet.
          </Typography>
        )}

        {customInstructions.length > 0 && (
          <List>
            {customInstructions.map((ci) => (
              <ListItem key={ci.id} disableGutters>
                <ListItemText
                  primary={ci.name}
                  secondary={ci.content.length > 50 ? ci.content.slice(0, 50) + '...' : ci.content}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(ci.id, ci.name, ci.content)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(ci.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Create/Edit Form */}
        <Stack direction="column" gap={1}>
          <TextField
            label="Instruction Name"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            variant="outlined"
            size="small"
          />
          <TextField
            label="Instruction Content"
            value={contentValue}
            onChange={(e) => setContentValue(e.target.value)}
            variant="outlined"
            multiline
            rows={3}
          />
          <Button variant="contained" onClick={handleSubmit}>
            {isEditing ? 'Update Instruction' : 'Add Instruction'}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  )
}