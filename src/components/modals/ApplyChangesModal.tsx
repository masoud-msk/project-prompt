// <ai_context>
//  A modal for applying XML-based code changes to the opened directory.
//  Contains a text area with example XML structure and a button to apply changes.
// </ai_context>

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  IconButton,
  TextField,
  Button,
  Tooltip,
  Typography,
  Box,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'

import { useFileStore } from '../../store/fileStore'
import { useToastStore } from '../../store/toastStore'

interface Props {
  open: boolean
  onClose: () => void
}

const exampleXml = `<code_changes>
  <changed_files>
    <file>
      <file_operation>CREATE</file_operation>
      <file_path>app/page.tsx</file_path>
      <file_code><![CDATA[
console.log("Hello from newly created file!")
]]></file_code>
    </file>
    <file>
      <file_operation>UPDATE</file_operation>
      <file_path>src/store.ts</file_path>
      <file_code><![CDATA[
// Some updated content
console.log("Store updated!")
]]></file_code>
    </file>
    <file>
      <file_operation>DELETE</file_operation>
      <file_path>src/oldFile.ts</file_path>
    </file>
  </changed_files>
</code_changes>`

const StyledDialogTitle = styled(DialogTitle)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}))

const ModalContent = styled(Box)(() => ({
  paddingLeft: 24,
  paddingRight: 24,
  paddingBottom: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: 400,
}))

export default function ApplyChangesModal({ open, onClose }: Props) {
  const { lastDirHandle } = useFileStore()
  const { showSuccessToast, showErrorToast } = useToastStore()

  const [xmlText, setXmlText] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const handleClose = () => {
    onClose()
  }

  const handleApply = async () => {
    if (!lastDirHandle) {
      showErrorToast('No directory open.')
      return
    }
    setIsApplying(true)
    try {
      // We'll do the direct logic here because we no longer store applyXmlChanges in fileStore
      // But we can do it inline or create a helper function
      const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
      const parserError = doc.querySelector('parsererror')
      if (parserError) {
        throw new Error('XML format error!')
      }

      const files = doc.querySelectorAll('changed_files > file')
      if (!files.length) {
        throw new Error('No <file> elements found in code_changes')
      }

      for (const fileElem of files) {
        const operation = fileElem
          .querySelector('file_operation')
          ?.textContent?.trim()
        let filePath = fileElem.querySelector('file_path')?.textContent?.trim()

        if (!operation || !filePath) {
          throw new Error('Missing file_operation or file_path')
        }

        filePath = filePath.replace(/\\/g, '/')
        const segments = filePath.split('/').filter(Boolean)
        if (!segments.length) {
          throw new Error('Invalid file path')
        }

        const fileName = segments.pop()!
        const directorySegments = segments

        if (operation === 'CREATE' || operation === 'UPDATE') {
          const fileCode =
            fileElem.querySelector('file_code')?.textContent || ''

          const parentDir = await getDirectoryHandleRecursive(
            lastDirHandle,
            directorySegments,
          )
          const fileHandle = await parentDir.getFileHandle(fileName, {
            create: true,
          })
          const writable = await fileHandle.createWritable()
          await writable.write(fileCode)
          await writable.close()
        } else if (operation === 'DELETE') {
          const parentDir = await getDirectoryHandleRecursive(
            lastDirHandle,
            directorySegments,
          )
          await parentDir.removeEntry(fileName, { recursive: true })
        } else {
          throw new Error(`Unknown file operation: ${operation}`)
        }
      }

      showSuccessToast('All changes applied successfully!')
      onClose()
    } catch (error) {
      console.error('Error applying changes:', error)
      showErrorToast('Error applying changes!')
    } finally {
      setIsApplying(false)
    }
  }

  async function getDirectoryHandleRecursive(
    baseHandle: FileSystemDirectoryHandle,
    segments: string[],
  ): Promise<FileSystemDirectoryHandle> {
    let currentHandle = baseHandle
    for (const segment of segments) {
      currentHandle = await currentHandle.getDirectoryHandle(segment, {
        create: true,
      })
    }
    return currentHandle
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <StyledDialogTitle>
        Apply XML Code Changes
        <Tooltip title="Close">
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </StyledDialogTitle>

      <ModalContent>
        <Typography variant="body2">
          Paste or edit your <strong>code_changes</strong> XML below:
        </Typography>

        <TextField
          label="XML Code Changes"
          multiline
          rows={12}
          value={xmlText}
          onChange={e => setXmlText(e.target.value)}
          placeholder={exampleXml}
          variant="outlined"
          fullWidth
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 1 }}>
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
      </ModalContent>
    </Dialog>
  )
}
