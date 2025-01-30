// <ai_context>
//  Zustand store for managing file selection, ignoring patterns, instructions, theme, etc.
//  Now includes localStorage persistence for file store and theme store, with default 'dark' theme.
// </ai_context>

import { create } from "zustand";
import { approximateTokens } from "./utils/tokenHelpers";

import { v4 as uuidv4 } from "uuid"; // for unique IDs

interface FileNode {
  name: string;
  path: string;
  handle: any;
  isDirectory: boolean;
  selected: boolean;
  children: FileNode[];
}

interface LoadedFile {
  path: string;
  content: string;
  tokenCount: number;
}

export interface CustomInstruction {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

interface FileStoreState {
  fileTree: FileNode[];
  selectedFiles: FileNode[];
  loadedFiles: LoadedFile[];
  instructions: string;
  ignorePatterns: string;

  // Custom instructions
  customInstructions: CustomInstruction[];

  openDirectory: () => Promise<void>;
  toggleSelection: (path: string, handle: any, isDirectory: boolean) => void;
  loadSelectedFiles: () => Promise<void>;
  setInstructions: (value: string) => void;
  setIgnorePatterns: (value: string) => void;

  // CRUD for custom instructions
  addCustomInstruction: (name: string, content: string) => void;
  updateCustomInstruction: (id: string, name: string, content: string) => void;
  removeCustomInstruction: (id: string) => void;
  toggleCustomInstruction: (id: string) => void;
}

// Utility function to build a file tree from a directory handle
async function buildFileTree(
  directoryHandle: any,
  currentPath = "",
): Promise<FileNode[]> {
  const items: FileNode[] = [];
  for await (const entry of directoryHandle.values()) {
    // Skip .git and node_modules directories
    if (
      entry.kind === "directory" &&
      (entry.name === ".git" || entry.name === "node_modules")
    ) {
      continue;
    }

    const path = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    if (entry.kind === "directory") {
      const children = await buildFileTree(entry, path);
      items.push({
        name: entry.name,
        path,
        handle: entry,
        isDirectory: true,
        selected: false,
        children,
      });
    } else {
      items.push({
        name: entry.name,
        path,
        handle: entry,
        isDirectory: false,
        selected: false,
        children: [],
      });
    }
  }
  // Sort directories first, then files
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
  return items;
}

// Simple ignore check: each line is a substring we match against the path.
function isIgnored(path: string, ignoreLines: string[]): boolean {
  return ignoreLines.some((line) => {
    const pattern = line.trim();
    if (!pattern) return false;
    return path.includes(pattern);
  });
}

// Used to remove FileSystemHandle references for localStorage
function stripHandlesFromTree(nodes: FileNode[]): Omit<FileNode, "handle">[] {
  return nodes.map((node) => {
    const { handle, children, ...rest } = node;
    return {
      ...rest,
      children:
        children && children.length ? stripHandlesFromTree(children) : [],
    };
  });
}

function persistFileState(state: FileStoreState) {
  const {
    fileTree,
    selectedFiles,
    loadedFiles,
    instructions,
    ignorePatterns,
    customInstructions,
  } = state;

  // Strip file handles from the stored data
  const newTree = stripHandlesFromTree(fileTree);
  const newSelected = stripHandlesFromTree(selectedFiles);

  // Save entire file state to localStorage
  const storeObj = {
    fileTree: newTree,
    selectedFiles: newSelected,
    loadedFiles,
    instructions,
    ignorePatterns,
    customInstructions,
  };
  localStorage.setItem("fileStoreData", JSON.stringify(storeObj));
}

function loadFileState() {
  try {
    const saved = localStorage.getItem("fileStoreData");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export const useFileStore = create<FileStoreState>((set, get) => {
  // Hydrate from localStorage if present
  const initialState: FileStoreState = {
    fileTree: [],
    selectedFiles: [],
    loadedFiles: [],
    instructions: "",
    ignorePatterns: "",
    customInstructions: [],

    openDirectory: async () => {},
    toggleSelection: () => {},
    loadSelectedFiles: async () => {},
    setInstructions: () => {},
    setIgnorePatterns: () => {},

    addCustomInstruction: () => {},
    updateCustomInstruction: () => {},
    removeCustomInstruction: () => {},
    toggleCustomInstruction: () => {},
  };

  const savedState = loadFileState();
  const baseState = savedState
    ? { ...initialState, ...savedState }
    : initialState;

  return {
    ...baseState,

    async openDirectory() {
      if (!window.showDirectoryPicker) {
        alert("File System Access API is not supported in this browser.");
        return;
      }
      try {
        const dirHandle = await window.showDirectoryPicker();
        const tree = await buildFileTree(dirHandle);
        set({ fileTree: tree, selectedFiles: [], loadedFiles: [] });
        persistFileState(get());
      } catch (err) {
        console.error("Error opening directory:", err);
      }
    },

    toggleSelection(path: string, handle: any, isDirectory: boolean) {
      const { fileTree } = get();

      const updateSelection = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            const newVal = !node.selected;
            if (node.isDirectory && node.children?.length) {
              node.children = toggleChildren(node.children, newVal);
            }
            return { ...node, selected: newVal };
          }
          if (node.children?.length) {
            return { ...node, children: updateSelection(node.children) };
          }
          return node;
        });
      };

      const toggleChildren = (
        nodes: FileNode[],
        newVal: boolean,
      ): FileNode[] => {
        return nodes.map((n) => {
          if (n.isDirectory && n.children?.length) {
            n.children = toggleChildren(n.children, newVal);
          }
          return { ...n, selected: newVal };
        });
      };

      const newTree = updateSelection(fileTree);

      // Rebuild selected files array
      const allSelected: FileNode[] = [];
      const gatherSelected = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
          if (node.selected) {
            allSelected.push(node);
          }
          if (node.isDirectory && node.children?.length) {
            gatherSelected(node.children);
          }
        });
      };
      gatherSelected(newTree);

      set({ fileTree: newTree, selectedFiles: allSelected });
      persistFileState(get());
    },

    async loadSelectedFiles() {
      const { selectedFiles, ignorePatterns } = get();
      const ignoreLines = ignorePatterns.split("\n");

      const loadedFiles: LoadedFile[] = [];
      for (const fileNode of selectedFiles) {
        if (fileNode.isDirectory) continue;
        if (isIgnored(fileNode.path, ignoreLines)) continue;

        try {
          const fileData = await fileNode.handle.getFile();
          const content = await fileData.text();
          const tokenCount = approximateTokens(content);

          loadedFiles.push({
            path: fileNode.path,
            content,
            tokenCount,
          });
        } catch (err) {
          console.error("Error reading file:", err);
        }
      }

      set({ loadedFiles });
      persistFileState(get());
    },

    setInstructions(value: string) {
      set({ instructions: value });
      persistFileState(get());
    },

    setIgnorePatterns(value: string) {
      set({ ignorePatterns: value });
      persistFileState(get());
    },

    // Custom instructions CRUD
    addCustomInstruction(name: string, content: string) {
      const newCI = {
        id: uuidv4(),
        name,
        content,
        isActive: true, // default active
      };
      const updated = [...get().customInstructions, newCI];
      set({ customInstructions: updated });
      persistFileState(get());
    },

    updateCustomInstruction(id: string, name: string, content: string) {
      const updated = get().customInstructions.map((ci) => {
        if (ci.id === id) {
          return { ...ci, name, content };
        }
        return ci;
      });
      set({ customInstructions: updated });
      persistFileState(get());
    },

    removeCustomInstruction(id: string) {
      const updated = get().customInstructions.filter((ci) => ci.id !== id);
      set({ customInstructions: updated });
      persistFileState(get());
    },

    toggleCustomInstruction(id: string) {
      const updated = get().customInstructions.map((ci) => {
        if (ci.id === id) {
          return { ...ci, isActive: !ci.isActive };
        }
        return ci;
      });
      set({ customInstructions: updated });
      persistFileState(get());
    },
  };
});

// THEME STORE (with localStorage persistence)
export const useThemeStore = create((set, get) => {
  // Hide the switch => we won't remove the code but set the default to 'dark'
  const savedTheme =
    typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  // Force default 'dark' if no saved theme
  const initialThemeMode = savedTheme || "dark";

  return {
    themeMode: initialThemeMode,
    toggleTheme: () => {
      const current = get().themeMode;
      const newTheme = current === "light" ? "dark" : "light";
      set({ themeMode: newTheme });
      localStorage.setItem("theme", newTheme);
    },
  };
});
