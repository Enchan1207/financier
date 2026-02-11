const Modes = ['development', 'staging', 'production'] as const
export type Mode = (typeof Modes)[number]

/** 文字列からモードを取得 */
export const parseMode = (raw: string | undefined): (typeof Modes)[number] => {
  if (raw === undefined) {
    throw new Error('no mode specified')
  }

  if (!(Modes as readonly string[]).includes(raw)) {
    throw new Error(`invalid mode specified: ${raw}`)
  }

  return raw as (typeof Modes)[number]
}
