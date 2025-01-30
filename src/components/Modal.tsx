// <ai_context>
//  A simple modal component that renders its children when "show" is true.
// </ai_context>

import React from 'react'
import { Box, Dialog, IconButton, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface ModalProps {
  show: boolean
  onClose: () => void
  children?: React.ReactNode
}

export default function Modal({ show, onClose, children }: ModalProps) {
  return (
    <Dialog open={show} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ position: 'relative', p: 2 }}>
        <Tooltip title="Close">
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
        {children}
      </Box>
    </Dialog>
  )
}