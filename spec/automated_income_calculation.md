# 報酬実績の自動計算

このドキュメントは、機能 _報酬定義に基づく報酬実績の自動計算_ の仕様を整理したものです。

## Overview

報酬実績の自動計算は、

- 各会計月度について
- 勤務日数をJOINし
- その月を期間に含む報酬定義をJOINし
- 報酬定義の種別を見て実数値を算出する

ことによって行われます。この操作は以下のSQLで実現されます。

```sql
SELECT
  m.user_id,
  m.financial_year,
  m.month,
  m.id financial_month_id,
  d.id definition_id,
  CASE
    WHEN d.kind = "related_by_workday" THEN d.value * w.count
    ELSE d.value
  END value
FROM
  financial_months m
  LEFT JOIN workdays w ON m.id = w.financial_month_id
  LEFT JOIN income_definitions d ON d.disabled_at > m.started_at
  AND d.enabled_at < m.ended_at
```

これにより、各月に対応する各報酬定義から算出された実績(具体的には `Omit<IncomeRecordRecord, 'id'>[]`)が求められます。
