// <ai_context>
//  A global snackbar that listens to the file store's toast state and displays a success message.
// </ai_context>

import React from 'react'
import { Snackbar, Alert } from '@mui/material'
import { useFileStore } from '../store'

export default function GlobalSnackbar() {
  const { toastOpen, toastMessage, toastSeverity, clearToast } = useFileStore()

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') return
    clearToast()
  }

  return (
    <Snackbar
      open={toastOpen}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity={toastSeverity}
        sx={{ width: '100%' }}
      >
        {toastMessage}
      </Alert>
    </Snackbar>
  )
}
