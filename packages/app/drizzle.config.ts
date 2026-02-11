import crypto from 'node:crypto'
import path from 'node:path'

import type { Config as DrizzleKitConfig } from 'drizzle-kit'
import { defineConfig } from 'drizzle-kit'
import * as fs from 'fs'

type WranglerConfig = {
  env: Record<
    string,
    {
      d1_databases: {
        database_id: string
      }[]
    }
  >
}

const baseConfig: Partial<DrizzleKitConfig> = {
  out: './drizzle',
  schema: ['./backend/schemas/*.ts'],
}

const buildConfig = (mode: string): DrizzleKitConfig => {
  const wranglerFilePath = path.join(__dirname, './wrangler.jsonc')
  const wranglerFileRaw = fs.readFileSync(wranglerFilePath).toString()
  const wranglerFileContent = JSON.parse(wranglerFileRaw) as WranglerConfig
  const databaseId = wranglerFileContent.env[mode].d1_databases[0].database_id

  if (mode === 'development') {
    const localSQLiteDir = path.join(
      __dirname,
      './.wrangler/state/v3/d1/miniflare-D1DatabaseObject',
    )
    fs.mkdirSync(localSQLiteDir, { recursive: true })

    const localSQLiteFilePath = path.join(
      localSQLiteDir,
      `${buildDatabaseFileName(databaseId)}.sqlite`,
    )

    return {
      ...baseConfig,
      dialect: 'sqlite',
      dbCredentials: {
        url: localSQLiteFilePath,
      },
    }
  }

  return {
    ...baseConfig,
    dialect: 'sqlite',
    driver: 'd1-http',
    dbCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      databaseId,
      token: process.env.CLOUDFLARE_API_TOKEN,
    },
  }
}

/**
 * build SQLite file name (using internal naming logic)
 * @see https://github.com/cloudflare/workers-sdk/blame/f550b62fd4fdd60c2600390754631d713140afd3/packages/miniflare/src/plugins/shared/index.ts#L266
 * @param databaseId
 * @returns the name of database file
 */
const buildDatabaseFileName = (databaseId: string) => {
  const key = crypto
    .createHash('sha256')
    .update('miniflare-D1DatabaseObject')
    .digest()

  const nameHmac = crypto
    .createHmac('sha256', key)
    .update(databaseId)
    .digest()
    .subarray(0, 16)

  const hmac = crypto
    .createHmac('sha256', key)
    .update(nameHmac)
    .digest()
    .subarray(0, 16)

  return Buffer.concat([nameHmac, hmac]).toString('hex')
}

// NOTE: シェル変数MODEを設定して環境を切り替え
const mode = process.env['MODE'] ?? 'development'
console.log(`Mode: ${mode}`)

export default defineConfig(buildConfig(mode))
