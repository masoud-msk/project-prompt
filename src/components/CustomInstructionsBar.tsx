// <ai_context>
//  Displays a horizontally scrollable list of custom instructions (by name).
//  Allows toggling them on/off and shows a tooltip with partial content.
//  Has a button at the end to open a modal for creating/editing instructions.
// </ai_context>

import React from 'react'
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { useFileStore } from '../store'
import { CustomInstructionsModal } from './CustomInstructionsModal'

export function CustomInstructionsBar() {
  const {
    customInstructions,
    toggleCustomInstruction
  } = useFileStore()

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editInstructionId, setEditInstructionId] = React.useState<string | null>(null)

  const handleOpenAddModal = () => {
    setEditInstructionId(null) // no existing instruction => create new
    setModalOpen(true)
  }

  const handleEdit = (id: string) => {
    setEditInstructionId(id)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditInstructionId(null)
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          gap: 1,
          mb: 1
        }}
      >
        {/* List of instructions */}
        {customInstructions.map((inst) => (
          <Box
            key={inst.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: inst.enabled ? 'primary.light' : 'inherit',
              borderRadius: 1,
              px: 1
            }}
          >
            <Tooltip title={inst.content.slice(0, 60) + (inst.content.length > 60 ? '...' : '')}>
              <Typography
                variant="body2"
                sx={{ cursor: 'pointer', fontWeight: 'bold', mr: 1 }}
                onClick={() => handleEdit(inst.id)}
              >
                {inst.name}
              </Typography>
            </Tooltip>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={inst.enabled}
                  onChange={() => toggleCustomInstruction(inst.id)}
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </Box>
        ))}

        {/* Button to create new instruction */}
        <IconButton onClick={handleOpenAddModal} size="small" color="primary">
          <AddCircleIcon />
        </IconButton>
      </Paper>

      {/* Modal for adding/editing instructions */}
      {modalOpen && (
        <CustomInstructionsModal
          open={modalOpen}
          onClose={handleCloseModal}
          editInstructionId={editInstructionId}
        />
      )}
    </Box>
  )
}