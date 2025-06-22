import type { Actual } from '@/domains/actual'

export interface ActualDao {
  /** 月度と定義を指定して実績を挿入または更新する */
  saveActual(actual: Actual): Promise<Actual | undefined>

  /** 月度と定義を指定して実績を削除する */
  deleteActual(actual: Actual): Promise<Actual | undefined>
}
