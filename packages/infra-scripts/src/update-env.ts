import path from 'node:path'

import * as fs from 'fs/promises'

import type { InfraScriptMain } from './handle'
import { handle } from './handle'

/**
 * Terraformからの入力をパースして環境変数を更新する
 *
 * @note envファイルに存在しないキーを渡した場合は無視されます。
 */
const main: InfraScriptMain = async ({ mode, input }): Promise<number> => {
  const keys = Object.keys(input)

  // .envファイルを読み込む
  const envFilePath = path.join(import.meta.dirname, `../../app/.env.${mode}`)
  const envFileLines = await fs
    .readFile(envFilePath)
    .then((buf) => buf.toString().split('\n'))

  // Terraformの入力と合わせてマージ
  const updated = envFileLines.map((line) => {
    const matchedKey = keys.find((key) => line.startsWith(`${key}=`))

    if (matchedKey === undefined) {
      return line
    }

    const value = input[matchedKey] as string
    return `${matchedKey}=${value}`
  })

  await fs.writeFile(envFilePath, updated.join('\n'))

  return 0
}

handle(main)
  .then((c) => {
    console.log(JSON.stringify({ ok: 'true' }))
    process.exit(c)
  })
  .catch((e: unknown) => {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.log(JSON.stringify({ error: message }))
    process.exit(1)
  })
