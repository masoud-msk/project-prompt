// <ai_context>
//  Helper for checking if a path is ignored according to a list of wildcard patterns
// </ai_context>

import { minimatch } from 'minimatch'

export function isIgnored(path: string, ignoreLines: string[]): boolean {
  return ignoreLines.some(line => {
    const pattern = line.trim()
    if (!pattern) return false

    // console.log('>>>>> isIgnored:', { path, pattern })
    return minimatch(path, pattern, { dot: true })
  })
}
