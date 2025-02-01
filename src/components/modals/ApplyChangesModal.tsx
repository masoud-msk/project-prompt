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
    <!-- Creating a new file -->
    <file>
      <file_operation>CREATE</file_operation>
      <file_path>app/newPage.tsx</file_path>
      <file_code><![CDATA[
console.log("Hello from newly created file!")
]]></file_code>
    </file>

    <!-- Deleting an old file -->
    <file>
      <file_operation>DELETE</file_operation>
      <file_path>src/oldFile.ts</file_path>
    </file>

    <!-- Full-file update (legacy approach) -->
    <file>
      <file_operation>UPDATE</file_operation>
      <file_path>src/store.ts</file_path>
      <file_code><![CDATA[
// Overwrite the entire file
console.log("Store updated with entire new content!")
]]></file_code>
    </file>

    <!-- Partial line updates (new approach) -->
    <file>
      <file_operation>UPDATE</file_operation>
      <file_path>src/components/Example.tsx</file_path>
      <diffs>
        <diff>
          <start_line>4</start_line>
          <end_line>7</end_line>
          <new_lines><![CDATA[
console.log("some new line");
console.log("another new line");
]]></new_lines>
        </diff>
        <diff>
          <start_line>10</start_line>
          <end_line>10</end_line>
          <new_lines><![CDATA[
console.log("completely replaced line 10");
]]></new_lines>
        </diff>
      </diffs>
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

        if (operation === 'CREATE') {
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
        } else if (operation === 'UPDATE') {
          const hasDiffs = fileElem.querySelector('diffs')
          if (hasDiffs) {
            // Partial line updates
            const parentDir = await getDirectoryHandleRecursive(
              lastDirHandle,
              directorySegments,
            )
            const fileHandle = await parentDir.getFileHandle(fileName, {
              create: false,
            })
            const originalFile = await fileHandle.getFile()
            const originalContent = await originalFile.text()
            const lines = originalContent.split('\n')

            // Gather all <diff> entries
            const diffElems = fileElem.querySelectorAll('diffs > diff')
            // Convert NodeList to an array for sorting
            const diffArray = Array.from(diffElems).map(diffElem => {
              const startLine = parseInt(
                diffElem.querySelector('start_line')?.textContent || '0',
                10,
              )
              const endLine = parseInt(
                diffElem.querySelector('end_line')?.textContent || '0',
                10,
              )
              const newLinesContent =
                diffElem.querySelector('new_lines')?.textContent || ''
              return { startLine, endLine, newLinesContent }
            })

            // Sort diffs descending by startLine so that line indexes remain correct
            diffArray.sort((a, b) => b.startLine - a.startLine)

            // Apply each diff
            for (const diff of diffArray) {
              // Validate line ranges
              if (
                diff.startLine < 1 ||
                diff.endLine < diff.startLine ||
                diff.startLine > lines.length
              ) {
                console.warn(
                  `Skipping invalid diff: start=${diff.startLine} end=${diff.endLine}`,
                )
                continue
              }

              // Convert 1-based line indexing to 0-based
              const startIndex = diff.startLine - 1
              const endIndex = Math.min(diff.endLine - 1, lines.length - 1)

              // Remove the specified lines
              lines.splice(startIndex, endIndex - startIndex + 1)

              // Insert the new lines if any
              if (diff.newLinesContent.length > 0) {
                const insertion = diff.newLinesContent.split('\n')
                // Insert at startIndex
                lines.splice(startIndex, 0, ...insertion)
              }
            }

            const newContent = lines.join('\n')
            const writable = await fileHandle.createWritable()
            await writable.write(newContent)
            await writable.close()
          } else {
            // Full file update fallback
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
          }
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

/*
Instruction:

### XML Format Guide

1. **Root Element**
   ```xml
   <code_changes>
     <changed_files>
       <!-- ...files here... -->
     </changed_files>
   </code_changes>
   ```
   - All file changes must be contained within `<code_changes>` > `<changed_files>`.

2. **File Element**
   Each changed file is represented by a `<file>` element with the following structure:

   ```xml
   <file>
     <file_operation>CREATE | UPDATE | DELETE</file_operation>
     <file_path>__RELATIVE FILE PATH HERE__</file_path>

     <!-- For CREATE or UPDATE (full-file overwrite) -->
     <file_code><![CDATA[
__FULL FILE CONTENT HERE__
]]></file_code>

     <!-- For partial line updates (only if file_operation=UPDATE) -->
     <diffs>
       <diff>
         <start_line>__NUMBER__</start_line>
         <end_line>__NUMBER__</end_line>
         <new_lines><![CDATA[
__REPLACEMENT LINES__
]]></new_lines>
       </diff>
       <!-- Additional <diff> blocks as needed -->
     </diffs>
   </file>
   ```

3. **Operations**

   - **CREATE**
     - Provide `<file_code>` containing the **complete** contents of the new file.
     - Example:
       ```xml
       <file>
         <file_operation>CREATE</file_operation>
         <file_path>src/newFile.ts</file_path>
         <file_code><![CDATA[
console.log("Hello from newly created file!")
]]></file_code>
       </file>
       ```

   - **DELETE**
     - No code or diffs are needed; just specify the path to be removed.
     - Example:
       ```xml
       <file>
         <file_operation>DELETE</file_operation>
         <file_path>src/obsoleteFile.ts</file_path>
       </file>
       ```

   - **UPDATE**
     - Option A (Full Overwrite): Provide `<file_code>` with **all** lines of the updated file:
       ```xml
       <file>
         <file_operation>UPDATE</file_operation>
         <file_path>src/updateMe.ts</file_path>
         <file_code><![CDATA[
// Entirely new content
console.log("Full file replaced!");
]]></file_code>
       </file>
       ```
     - Option B (Partial Line Updates): Provide a `<diffs>` section with one or more `<diff>` blocks. Each `<diff>` has:
       - `<start_line>`: First line to replace (1-indexed).
       - `<end_line>`: Last line to replace (inclusive, also 1-indexed).
       - `<new_lines>`: Replacement text (may contain multiple lines). If empty, the specified lines are removed without replacement.

       **Important**: If multiple `<diff>` blocks exist, apply them **from highest line number to lowest** to preserve correct offsets.

       ```xml
       <file>
         <file_operation>UPDATE</file_operation>
         <file_path>src/components/Example.tsx</file_path>
         <diffs>
           <diff>
             <start_line>4</start_line>
             <end_line>7</end_line>
             <new_lines><![CDATA[
console.log("some new line");
console.log("another new line");
]]></new_lines>
           </diff>
           <diff>
             <start_line>10</start_line>
             <end_line>10</end_line>
             <new_lines><![CDATA[
console.log("single line replaced");
]]></new_lines>
           </diff>
         </diffs>
       </file>
       ```
     - If both `<file_code>` and `<diffs>` are present, partial diffs can override certain lines after the file is otherwise replaced. (Implementation may vary.)

---

### Example of the Full Structure

```xml
<code_changes>
  <changed_files>
    <!-- CREATE a new file with full content -->
    <file>
      <file_operation>CREATE</file_operation>
      <file_path>app/page.tsx</file_path>
      <file_code><![CDATA[
console.log("Hello from newly created file!")
]]></file_code>
    </file>

    <!-- DELETE an old file -->
    <file>
      <file_operation>DELETE</file_operation>
      <file_path>src/oldFile.ts</file_path>
    </file>

    <!-- UPDATE a file using full overwrite -->
    <file>
      <file_operation>UPDATE</file_operation>
      <file_path>src/store.ts</file_path>
      <file_code><![CDATA[
// Entire file replaced
console.log("Store updated with new content!");
]]></file_code>
    </file>

    <!-- UPDATE a file with partial edits (line ranges) -->
    <file>
      <file_operation>UPDATE</file_operation>
      <file_path>src/components/Example.tsx</file_path>
      <diffs>
        <diff>
          <start_line>4</start_line>
          <end_line>7</end_line>
          <new_lines><![CDATA[
console.log("some new line");
console.log("another new line");
]]></new_lines>
        </diff>
        <diff>
          <start_line>10</start_line>
          <end_line>10</end_line>
          <new_lines><![CDATA[
console.log("completely replaced line 10");
]]></new_lines>
        </diff>
      </diffs>
    </file>
  </changed_files>
</code_changes>
```

With this enhanced format, you can continue to **create, delete, or fully replace** files, but also **insert/remove/replace** specific lines in an existing file without having to rewrite it entirely.
 */
