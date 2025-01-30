// <ai_context>
//  Utility helpers for token counting, etc.
//  Updated to produce an estimate using js-tiktoken to better approximate the OpenAI tokenizer.
// </ai_context>

import { encodingForModel, Tiktoken } from "js-tiktoken"

let enc: Tiktoken | null = null

export function approximateTokens(text: string): number {
  if (!text) return 0
  if (!enc) {
    // "gpt-3.5-turbo" or "gpt-4" or "gpt2", depending on your preference:
    enc = encodingForModel("gpt-3.5-turbo")
  }
  const tokens = enc.encode(text)
  return tokens.length
}