import path from 'node:path'

import * as fs from 'fs/promises'
import z from 'zod'

import type { InfraScriptMain } from './handle'
import { handle } from './handle'
import type { Mode } from './modes'

type D1DatabaseDefinition = {
  binding: string
  database_id: string
  database_name: string
  migrations_dir: string
}

type Config = {
  d1_databases: D1DatabaseDefinition[]
}

type WranglerRoot = {
  env: Record<Mode, Config>
}

const main: InfraScriptMain = async ({
  mode,
  input: inputRaw,
}): Promise<number> => {
  const inputSchema = z.object({
    database_id: z.string(),
    database_name: z.string(),
  })

  const input = inputSchema.parse(inputRaw)

  const wranglerFilePath = path.join(
    import.meta.dirname,
    '../../app/wrangler.jsonc',
  )
  const wranglerFileContent = await fs
    .readFile(wranglerFilePath)
    .then((buf) => buf.toString())
    .then((data) => JSON.parse(data) as WranglerRoot)

  wranglerFileContent.env[mode].d1_databases = [
    {
      binding: 'D1',
      database_id: input.database_id,
      database_name: input.database_name,
      migrations_dir: 'drizzle',
    },
  ]

  await fs.writeFile(
    wranglerFilePath,
    JSON.stringify(wranglerFileContent, null, 2),
  )

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
