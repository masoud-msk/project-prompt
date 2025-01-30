// <ai_context>
//  Zustand store for managing file selection, ignoring patterns, instructions, theme, etc.
//  Now includes localStorage persistence for file store and theme store, with default 'dark' theme.
// </ai_context>

import { create } from "zustand";
import { approximateTokens } from "./utils/tokenHelpers";
import { v4 as uuidv4 } from "uuid";

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

  lastDirHandle: any | null;

  // Custom instructions
  customInstructions: CustomInstruction[];

  // Tracks whether we include the file tree text in final prompt
  includeTreeInPrompt: boolean;
  setIncludeTreeInPrompt: (val: boolean) => void;

  // Persist selected file paths even if directory is closed/reopened
  persistedSelectedFilePaths: string[];

  openDirectory: () => Promise<void>;
  refreshDirectory: () => Promise<void>;
  toggleSelection: (path: string, handle: any, isDirectory: boolean) => void;
  loadSelectedFiles: () => Promise<void>;
  setInstructions: (value: string) => void;
  setIgnorePatterns: (value: string) => void;

  // CRUD for custom instructions
  addCustomInstruction: (name: string, content: string) => void;
  updateCustomInstruction: (id: string, name: string, content: string) => void;
  removeCustomInstruction: (id: string) => void;
  toggleCustomInstruction: (id: string) => void;

  // Clear selection
  clearSelection: () => void;
}

async function buildFileTree(
  directoryHandle: any,
  currentPath = ""
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

function isIgnored(path: string, ignoreLines: string[]): boolean {
  return ignoreLines.some((line) => {
    const pattern = line.trim();
    if (!pattern) return false;
    return path.includes(pattern);
  });
}

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
    lastDirHandle,
    includeTreeInPrompt,
    persistedSelectedFilePaths
  } = state;

  const newTree = stripHandlesFromTree(fileTree);
  const newSelected = stripHandlesFromTree(selectedFiles);

  const storeObj = {
    fileTree: newTree,
    selectedFiles: newSelected,
    loadedFiles,
    instructions,
    ignorePatterns,
    customInstructions,
    lastDirHandle: null, // can't store real handle
    includeTreeInPrompt,
    persistedSelectedFilePaths
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
  const initialState: FileStoreState = {
    fileTree: [],
    selectedFiles: [],
    loadedFiles: [],
    instructions: "",
    ignorePatterns: "",
    lastDirHandle: null,

    customInstructions: [],

    includeTreeInPrompt: false,
    setIncludeTreeInPrompt: () => {},

    persistedSelectedFilePaths: [],

    openDirectory: async () => {},
    refreshDirectory: async () => {},
    toggleSelection: () => {},
    loadSelectedFiles: async () => {},
    setInstructions: () => {},
    setIgnorePatterns: () => {},

    addCustomInstruction: () => {},
    updateCustomInstruction: () => {},
    removeCustomInstruction: () => {},
    toggleCustomInstruction: () => {},

    clearSelection: () => {}
  };

  const savedState = loadFileState();
  const baseState = savedState ? { ...initialState, ...savedState } : initialState;

  return {
    ...baseState,

    setIncludeTreeInPrompt(val: boolean) {
      set({ includeTreeInPrompt: val });
      persistFileState(get());
    },

    async openDirectory() {
      if (!window.showDirectoryPicker) {
        alert("File System Access API is not supported in this browser.");
        return;
      }
      try {
        const dirHandle = await window.showDirectoryPicker();
        const tree = await buildFileTree(dirHandle);
        // Reselect nodes that were previously selected
        const reselectTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            const newNode = { ...node };
            if (get().persistedSelectedFilePaths.includes(node.path)) {
              newNode.selected = true;
            }
            if (node.isDirectory && node.children?.length) {
              newNode.children = reselectTree(node.children);
            }
            return newNode;
          });
        };
        const updatedTree = reselectTree(tree);

        // Gather the newly reselected
        const newSelected: FileNode[] = [];
        const gatherSelected = (nodes: FileNode[]) => {
          nodes.forEach((n) => {
            if (n.selected) {
              newSelected.push(n);
            }
            if (n.isDirectory && n.children?.length) {
              gatherSelected(n.children);
            }
          });
        };
        gatherSelected(updatedTree);

        set({
          fileTree: updatedTree,
          selectedFiles: newSelected,
          loadedFiles: [],
          lastDirHandle: dirHandle
        });
        persistFileState(get());
      } catch (err) {
        console.error("Error opening directory:", err);
      }
    },

    async refreshDirectory() {
      const { lastDirHandle } = get();
      if (lastDirHandle) {
        try {
          const tree = await buildFileTree(lastDirHandle);
          // Reselect nodes that were previously selected
          const reselectTree = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((node) => {
              const newNode = { ...node };
              if (get().persistedSelectedFilePaths.includes(node.path)) {
                newNode.selected = true;
              }
              if (node.isDirectory && node.children?.length) {
                newNode.children = reselectTree(node.children);
              }
              return newNode;
            });
          };
          const updatedTree = reselectTree(tree);

          // Gather the newly reselected
          const newSelected: FileNode[] = [];
          const gatherSelected = (nodes: FileNode[]) => {
            nodes.forEach((n) => {
              if (n.selected) {
                newSelected.push(n);
              }
              if (n.isDirectory && n.children?.length) {
                gatherSelected(n.children);
              }
            });
          };
          gatherSelected(updatedTree);

          set({
            fileTree: updatedTree,
            selectedFiles: newSelected,
            loadedFiles: []
          });
          persistFileState(get());
          return;
        } catch (err) {
          console.error("Error refreshing directory:", err);
        }
      }
      await get().openDirectory();
    },

    toggleSelection(path: string, handle: any, isDirectory: boolean) {
      const { fileTree, persistedSelectedFilePaths } = get();

      const updateSelection = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            const newVal = !node.selected;
            // Update persisted paths
            let newPersisted = [...persistedSelectedFilePaths];
            if (newVal) {
              if (!newPersisted.includes(node.path)) {
                newPersisted.push(node.path);
              }
            } else {
              newPersisted = newPersisted.filter((p) => p !== node.path);
            }
            set({ persistedSelectedFilePaths: newPersisted });

            if (node.isDirectory && node.children?.length) {
              node.children = toggleChildren(node.children, newVal, newPersisted);
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
        newPersisted: string[]
      ): FileNode[] => {
        return nodes.map((n) => {
          if (newVal) {
            if (!newPersisted.includes(n.path)) {
              newPersisted.push(n.path);
            }
          } else {
            const idx = newPersisted.indexOf(n.path);
            if (idx !== -1) {
              newPersisted.splice(idx, 1);
            }
          }

          if (n.isDirectory && n.children?.length) {
            n.children = toggleChildren(n.children, newVal, newPersisted);
          }
          return { ...n, selected: newVal };
        });
      };

      const newTree = updateSelection(fileTree);

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

    addCustomInstruction(name: string, content: string) {
      const newCI = {
        id: uuidv4(),
        name,
        content,
        isActive: true,
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

    clearSelection() {
      const { fileTree } = get();

      const clearAll = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.children?.length) {
            node.children = clearAll(node.children);
          }
          return { ...node, selected: false };
        });
      };
      const newTree = clearAll(fileTree);

      set({
        fileTree: newTree,
        selectedFiles: [],
        loadedFiles: [],
        persistedSelectedFilePaths: []
      });
      persistFileState(get());
    }
  };
});

// THEME STORE
export const useThemeStore = create((set, get) => {
  const savedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
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