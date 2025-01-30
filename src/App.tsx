// <ai_context>
//  Main application component, fully using MUI for layout.
//  1) Full height usage
//  2) "CustomInstructionsBar" is placed above "InstructionsField", not in the top AppBar
//  3) The top bar just has "Repo Prompt", "Load", "Prompt"
//  4) "Open" but remove "Refresh" from Directory Structure panel
// </ai_context>

import { useState } from 'react'
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
import VisibilityIcon from '@mui/icons-material/Visibility'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import ClearIcon from '@mui/icons-material/Clear'

import { useFileStore } from './store'
import DirectoryTree from './components/DirectoryTree'
import InstructionsField from './components/InstructionsField'
import IgnoreInput from './components/IgnoreInput'
import SelectedFilesList from './components/SelectedFilesList'
import PromptGenerator from './components/PromptGenerator'
import Modal from './components/Modal'
import CustomInstructionsBar from './components/CustomInstructionsBar'

export default function App() {
  const {
    loadSelectedFiles,
    fileTree,
    selectedFiles,
    openDirectory,
    clearSelection,
  } = useFileStore()
  const [showPromptModal, setShowPromptModal] = useState(false)

  const handleShowPrompt = () => setShowPromptModal(true)
  const handleClosePrompt = () => setShowPromptModal(false)

  const handleOpenDirectory = () => {
    openDirectory()
  }

  const handleClearSelection = () => {
    clearSelection()
  }

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

          {/* "Load" and "Prompt" on the right side */}
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Tooltip title="Load selected files">
              <span>
                <Button
                  color="inherit"
                  onClick={loadSelectedFiles}
                  disabled={selectedFiles.length === 0}
                  startIcon={<DownloadIcon />}
                >
                  Load
                </Button>
              </span>
            </Tooltip>

            <Tooltip title="View final prompt">
              <Button
                color="inherit"
                onClick={handleShowPrompt}
                startIcon={<VisibilityIcon />}
              >
                Prompt
              </Button>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main content area */}
      <Box sx={{ display: 'flex', flex: 1, p: 2, gap: 2 }}>
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
              Directory Structure
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

          {/* Tree content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {fileTree.length === 0 ? (
              <Typography variant="body2">No directory opened yet.</Typography>
            ) : (
              <DirectoryTree />
            )}
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

          {/* Ignore Patterns */}
          <Box>
            <IgnoreInput />
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

      {/* Prompt Modal */}
      <Modal show={showPromptModal} onClose={handleClosePrompt}>
        <Typography variant="h6" gutterBottom>
          Final Prompt
        </Typography>
        <PromptGenerator />
      </Modal>
    </Wrapper>
  )
}

const Wrapper = muiStyled(Container)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}))
