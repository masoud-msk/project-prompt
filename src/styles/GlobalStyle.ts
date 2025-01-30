// <ai_context>
//  A basic global style to unify default font, margins, etc.
//  We want to set html,body,#root to overflow hidden, with a fixed height so that
//  the app itself doesn't scroll, only the specific scrollable areas do (tree content, loaded files).
// </ai_context>

import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  /* Make scrollbars thin and auto-hide in WebKit-based browsers */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.border};
    border-radius: 4px;
  }
  ::-webkit-scrollbar-track {
    background-color: transparent;
  }
  ::-webkit-scrollbar-thumb:hover {
    background-color: ${({ theme }) => theme.text};
  }
  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }
  /* For Firefox, etc. using overlay scrollbars if possible */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.border} transparent;

  html, body, #root {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden; /* Hide overflow at root level */
  }

  body {
    font-family: sans-serif;
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  }

  textarea, input {
    background-color: ${({ theme }) => theme.inputBg};
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 4px;
    outline: none;
  }
`;
