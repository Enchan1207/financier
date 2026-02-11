import { Command } from 'commander'

import type { Mode } from './modes'
import { parseMode } from './modes'

export type InfraScriptMain = (props: {
  mode: Mode
  input: Record<string, unknown>
}) => number | Promise<number>

export const handle = async (fn: InfraScriptMain): Promise<number> => {
  const options: Record<string, string | undefined> = new Command()
    .option('--mode <name>', 'mode')
    .parse()
    .opts()

  const mode = parseMode(options.mode)

  // Terraformからの入力をパース
  const input = await new Promise<string>((resolve) => {
    let data = ''
    process.stdin.on('data', (chunk) => (data += chunk.toString()))
    process.stdin.on('end', () => {
      resolve(data)
    })
  }).then((data) => JSON.parse(data) as Record<string, unknown>)

  return fn({ mode, input })
}
