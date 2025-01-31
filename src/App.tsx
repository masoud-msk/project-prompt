
/*
// <ai_context>
//  Main application component, fully using MUI for layout.
//  1) Full height usage
//  2) "CustomInstructionsBar" is placed above "InstructionsField", not in the top AppBar
//  3) The top bar just has "Repo Prompt", "Load", "Prompt"
//  4) "Open" but remove "Refresh" from Directory Structure panel
// </ai_context>
*/

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import { styled as muiStyled } from '@mui/material/styles'
import DownloadIcon from '@mui/icons-material/Download'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import ClearIcon from '@mui/icons-material/Clear'
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt'
import { useState, useEffect } from 'react'
import { useFileStore } from './store'
import DirectoryTree from './components/DirectoryTree'
import InstructionsField from './components/InstructionsField'
import IgnoreInput from './components/IgnoreInput'
import SelectedFilesList from './components/SelectedFilesList'
import CustomInstructionsBar from './components/CustomInstructionsBar'
import GlobalSnackbar from './components/GlobalSnackbar'
import ApplyChangesModal from './components/ApplyChangesModal'

export default function App() {
  const {
    loadSelectedFiles,
    fileTree,
    selectedFiles,
    openDirectory,
    clearSelection,
    lastDirHandle,
    refreshDirectory,
    rootDirectoryPath,
  } = useFileStore()

  // If we have a handle, just refresh on mount.
  // But if we do NOT have a handle, we can show a "Reopen last folder" button below instead
  useEffect(() => {
    if (lastDirHandle) {
      refreshDirectory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOpenDirectory = () => {
    openDirectory()
  }

  const handleClearSelection = () => {
    clearSelection()
  }

  const [changesModalOpen, setChangesModalOpen] = useState(false)
  const openChangesModal = () => setChangesModalOpen(true)
  const closeChangesModal = () => setChangesModalOpen(false)

  return (
    <Wrapper maxWidth={false} disableGutters>
      {/* Top AppBar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ borderBottom: 'none', p: 0 }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: 2,
            minHeight: '44px',
          }}
        >
          <Typography variant="h6" sx={{ whiteSpace: 'nowrap' }}>
            Project Prompt
          </Typography>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* "Apply Changes" button in the AppBar */}
          <Tooltip title="Apply code changes (XML)">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SystemUpdateAltIcon />}
              onClick={openChangesModal}
              disabled={!lastDirHandle} 
            >
              Apply Changes
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main content area */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          p: 2,
          gap: 2,
          height: 'calc(100% - 64px)',
          overflow: 'auto',
        }}
      >
        {/* Left Pane (Directory Tree) */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {/* Directory Structure header (Open + Clear) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              borderBottom: 1,
              borderColor: 'divider',
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {lastDirHandle ? lastDirHandle.name : 'Directory Structure'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Open directory">
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<FolderOpenIcon />}
                  onClick={handleOpenDirectory}
                >
                  Open
                </Button>
              </Tooltip>
              <Tooltip title="Clear selection">
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={handleClearSelection}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* If we don't have a handle, but do have rootDirectoryPath, show "Reopen last folder" */}
          {!lastDirHandle && rootDirectoryPath && (
            <Box sx={{ p: 1 }}>
              <Button
                variant="outlined"
                onClick={handleOpenDirectory}
              >
                (!)&nbsp;Reopen last folder: {rootDirectoryPath}
              </Button>
            </Box>
          )}

          {/* Tree content (fills remaining space) */}
          <Box sx={{ flex: 1, position: 'relative', overflowY: 'auto', p: 1 }}>
            {fileTree.length === 0 ? (
              <Typography variant="body2">No directory opened yet.</Typography>
            ) : (
              <DirectoryTree />
            )}
            {/* Dark overlay if no directory handle */}
            {!lastDirHandle && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  zIndex: 10,
                }}
              />
            )}
          </Box>

          {/* Bottom: Ignore Patterns + Load Button */}
          <Box
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              p: 1,
              display: 'flex',
              gap: 1,
            }}
          >
            <IgnoreInput />
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={loadSelectedFiles}
              disabled={!lastDirHandle || selectedFiles.length === 0}
            >
              Load Files
            </Button>
          </Box>
        </Box>

        {/* Right Pane */}
        <Box
          sx={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            gap: 2,
            overflow: 'hidden',
          }}
        >
          {/* Custom Instructions Bar */}
          <CustomInstructionsBar />

          {/* Instructions */}
          <Box>
            <InstructionsField />
          </Box>

          {/* Loaded Files (scrollable) */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              minHeight: 0,
            }}
          >
            <SelectedFilesList />
          </Box>
        </Box>
      </Box>

      {/* Modal for applying XML changes */}
      <ApplyChangesModal open={changesModalOpen} onClose={closeChangesModal} />

      {/* Global Snackbar for success/error messages */}
      <GlobalSnackbar />
    </Wrapper>
  )
}

const Wrapper = muiStyled(Container)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}))
