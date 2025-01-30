// <ai_context>
//  Renders the nested directory structure using MUI icons and checkboxes.
//  Also uses Material icons for folder/file and expand/collapse indicators.
//  We decreased the margin/padding between rows further.
// </ai_context>

import React, { useState } from 'react'
import {
  Box,
  Checkbox,
  IconButton,
  Typography
} from '@mui/material'
import { styled as muiStyled } from '@mui/material/styles'
import FolderIcon from '@mui/icons-material/Folder'
import DescriptionIcon from '@mui/icons-material/Description'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useFileStore } from '../store'

interface FileNode {
  name: string
  path: string
  handle?: any
  isDirectory: boolean
  selected: boolean
  children?: FileNode[]
}

export default function DirectoryTree() {
  const { fileTree, toggleSelection } = useFileStore()
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

  const handleExpandToggle = (path: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [path]: !prev[path]
    }))
  }

  const renderTree = (nodes: FileNode[]) => {
    return nodes.map((node) => {
      const isFolder = node.isDirectory
      const isExpanded = expandedNodes[node.path] || false

      const handleCheckboxChange = () => {
        toggleSelection(node.path, node.handle, isFolder)
      }

      return (
        <NodeBox key={node.path}>
          <RowBox>
            {isFolder ? (
              <IconButton
                size="small"
                onClick={() => handleExpandToggle(node.path)}
              >
                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            ) : (
              <IconButton size="small" sx={{ visibility: 'hidden' }}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            )}

            <Checkbox
              size="small"
              checked={node.selected}
              onChange={handleCheckboxChange}
              sx={{ mr: 1 }}
            />
            {isFolder ? (
              <FolderIcon fontSize="small" sx={{ mr: 0.5 }} />
            ) : (
              <DescriptionIcon fontSize="small" sx={{ mr: 0.5 }} />
            )}

            <Typography variant="body2">{node.name}</Typography>
          </RowBox>
          {isFolder && node.children && node.children.length > 0 && isExpanded && (
            <IndentBox>
              {renderTree(node.children)}
            </IndentBox>
          )}
        </NodeBox>
      )
    })
  }

  return <Box>{renderTree(fileTree)}</Box>
}

const NodeBox = muiStyled(Box)(() => ({
  marginBottom: '1px' // Slightly smaller spacing
}))

const RowBox = muiStyled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '2px'
}))

const IndentBox = muiStyled(Box)(() => ({
  marginLeft: '1.2rem'
}))