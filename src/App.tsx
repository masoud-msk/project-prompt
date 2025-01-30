// <ai_context>
//  Main application component, fully using MUI for layout.
//  1) Hide the dark/light switch in the app bar
//  2) Keep default as dark theme
//  3) Use the new gold primary color from the updated theme
//  4) Ensure only directory tree content and loaded files scroll
// </ai_context>

import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  Stack,
  IconButton
} from '@mui/material'
import { styled as muiStyled } from '@mui/material/styles'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import DownloadIcon from '@mui/icons-material/Download'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RefreshIcon from '@mui/icons-material/Refresh'

import { useFileStore } from './store'
import DirectoryTree from './components/DirectoryTree'
import InstructionsField from './components/InstructionsField'
import IgnoreInput from './components/IgnoreInput'
import SelectedFilesList from './components/SelectedFilesList'
import PromptGenerator from './components/PromptGenerator'
import Modal from './components/Modal'

export default function App() {
  const { openDirectory, loadSelectedFiles, fileTree, selectedFiles } = useFileStore()
  const [showPromptModal, setShowPromptModal] = useState(false)

  const handleShowPrompt = () => setShowPromptModal(true)
  const handleClosePrompt = () => setShowPromptModal(false)

  const handleRefreshDirectory = () => {
    // We'll simply re-open the directory to "refresh"
    openDirectory()
  }

  return (
    <Wrapper maxWidth={false} disableGutters>
      {/* Top AppBar */}
      <AppBar position="static" elevation={0} sx={{ borderBottom: 'none' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Repo Prompt WebApp
          </Typography>

          <Stack direction="row" spacing={1}>
            {/* Open Directory Button (with label) */}
            <Button
              color="inherit"
              onClick={openDirectory}
              startIcon={<FolderOpenIcon />}
            >
              Open
            </Button>

            {/* Load Files Button (with label) */}
            <Button
              color="inherit"
              onClick={loadSelectedFiles}
              disabled={selectedFiles.length === 0}
              startIcon={<DownloadIcon />}
            >
              Load
            </Button>

            {/* Show Prompt Button (with label) */}
            <Button
              color="inherit"
              onClick={handleShowPrompt}
              startIcon={<VisibilityIcon />}
            >
              Prompt
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ display: 'flex', flex: 1, p: 2, gap: 2 }}>
        {/* Left Pane (DirectoryTree) */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          {/* Header row with "Directory Structure" label and refresh button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1,
              borderBottom: 1,
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Directory Structure
            </Typography>
            <IconButton
              size="small"
              color="inherit"
              onClick={handleRefreshDirectory}
              title="Refresh Directory"
            >
              <RefreshIcon />
            </IconButton>
          </Box>

          {/* Actual tree content */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1
            }}
          >
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
            overflow: 'hidden'
          }}
        >
          {/* Instructions (with "Copy Prompt" button) */}
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
              minHeight: 0
            }}
          >
            <SelectedFilesList />
          </Box>
        </Box>
      </Box>

      {/* Modal for Final Prompt */}
      <Modal show={showPromptModal} onClose={handleClosePrompt}>
        <Typography variant="h6" gutterBottom>
          Final Prompt
        </Typography>
        <PromptGenerator />
      </Modal>
    </Wrapper>
  )
}

const Wrapper = muiStyled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary
}))