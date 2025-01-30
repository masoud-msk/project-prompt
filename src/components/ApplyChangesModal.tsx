// <ai_context>
//  A modal for applying XML-based code changes to the opened directory.
//  Contains a text area with example XML structure and a button to apply changes.
// </ai_context>

import { useState } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  TextField,
  Button,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useFileStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
}

const exampleXml = `<code_changes>
  <changed_files>
    <file>
      <file_operation>CREATE</file_operation>
      <file_path>test/hello.ts</file_path>
      <file_code><![CDATA[
console.log("Hello from newly created file!")
]]></file_code>
    </file>
  </changed_files>
</code_changes>`

export default function ApplyChangesModal({ open, onClose }: Props) {
  const { applyXmlChanges } = useFileStore()

  const [xmlText, setXmlText] = useState(exampleXml)
  const [isApplying, setIsApplying] = useState(false)

  const handleClose = () => {
    onClose()
  }

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await applyXmlChanges(xmlText)
      // If successful, close modal
      onClose()
    } catch (error) {
      console.error('Error applying changes:', error)
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        Apply XML Code Changes
        <Tooltip title="Close">
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <Box
        sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography variant="body2">
          Paste or edit your <strong>code_changes</strong> XML below:
        </Typography>

        <TextField
          label="XML Code Changes"
          multiline
          rows={12}
          value={xmlText}
          onChange={e => setXmlText(e.target.value)}
          variant="outlined"
          fullWidth
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Tooltip title="Apply the changes to your open directory">
            <span>
              <Button
                variant="contained"
                color="primary"
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? 'Applying...' : 'Apply Changes'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Dialog>
  )
}
