// <ai_context>
//  Main application component, fully using MUI for layout.
//  1) Full height usage
//  2) "CustomInstructionsBar" is placed above "InstructionsField", not in the top AppBar
//  3) The top bar just has "Repo Prompt", "Load", "Prompt"
//  4) "Open" but remove "Refresh" from Directory Structure panel
// </ai_context>

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
import { useFileStore } from './store'
import DirectoryTree from './components/DirectoryTree'
import InstructionsField from './components/InstructionsField'
import IgnoreInput from './components/IgnoreInput'
import SelectedFilesList from './components/SelectedFilesList'
import CustomInstructionsBar from './components/CustomInstructionsBar'
import GlobalSnackbar from './components/GlobalSnackbar'

export default function App() {
  const {
    loadSelectedFiles,
    fileTree,
    selectedFiles,
    openDirectory,
    clearSelection,
    lastDirHandle,
  } = useFileStore()

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

          {/* "Load" on the right side */}
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
          </Stack>
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
