import { Button } from '@frontend/components/ui/button'
import dayjs from '@frontend/lib/date'
import { TODAY } from '@frontend/lib/today'
import type {
  SavingDefinition,
  SavingWithdrawal,
  Transaction,
} from '@frontend/lib/types'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowDownLeftIcon,
  ArrowLeftIcon,
  PencilIcon,
  PiggyBankIcon,
} from 'lucide-react'
import { useState } from 'react'

import { ContributionHistoryTable } from './-components/contribution-history-table'
import { SavingContributionDialog } from './-components/saving-contribution-dialog'
import { SavingEditDialog } from './-components/saving-edit-dialog'
import { SavingSummaryCard } from './-components/saving-summary-card'
import { SavingWithdrawalDialog } from './-components/saving-withdrawal-dialog'
import { WithdrawalHistoryTable } from './-components/withdrawal-history-table'

// モックデータ：本番ではAPIから取得する
const savings: SavingDefinition[] = [
  {
    id: 'sav-1',
    categoryId: 'cat-8',
    categoryName: '遠征費積立',
    type: 'goal',
    targetAmount: 200000,
    deadline: '2026-08-01',
    balance: 90000,
    monthlyGuide: 22000,
  },
  {
    id: 'sav-2',
    categoryId: 'cat-9',
    categoryName: 'グッズ積立',
    type: 'free',
    balance: 35000,
  },
  {
    id: 'sav-3',
    categoryId: 'cat-11',
    categoryName: '旅行費積立',
    type: 'goal',
    targetAmount: 70000,
    deadline: '2026-12-01',
    balance: 18000,
    monthlyGuide: 6000,
  },
  {
    id: 'sav-4',
    categoryId: 'cat-12',
    categoryName: '機材費積立',
    type: 'goal',
    targetAmount: 200000,
    deadline: '2026-06-30',
    balance: 170000,
    monthlyGuide: 25000,
  },
  {
    id: 'sav-5',
    categoryId: 'cat-13',
    categoryName: '緊急資金',
    type: 'free',
    balance: 150000,
  },
]

const transactions: Transaction[] = [
  {
    id: 'tx-5',
    type: 'expense',
    amount: 30000,
    categoryId: 'cat-8',
    categoryName: '積立：遠征費',
    transactionDate: '2026-02-08',
    name: '2月分積立',
  },
  {
    id: 'tx-s1',
    type: 'expense',
    amount: 30000,
    categoryId: 'cat-8',
    categoryName: '積立：遠征費',
    transactionDate: '2025-12-01',
    name: '12月分積立',
  },
  {
    id: 'tx-s2',
    type: 'expense',
    amount: 30000,
    categoryId: 'cat-8',
    categoryName: '積立：遠征費',
    transactionDate: '2026-01-05',
    name: '1月分積立',
  },
  {
    id: 'tx-s3',
    type: 'expense',
    amount: 10000,
    categoryId: 'cat-9',
    categoryName: '積立：グッズ',
    transactionDate: '2025-11-01',
    name: '11月分積立',
  },
  {
    id: 'tx-s4',
    type: 'expense',
    amount: 15000,
    categoryId: 'cat-9',
    categoryName: '積立：グッズ',
    transactionDate: '2025-12-01',
    name: '12月分積立',
  },
  {
    id: 'tx-s5',
    type: 'expense',
    amount: 10000,
    categoryId: 'cat-9',
    categoryName: '積立：グッズ',
    transactionDate: '2026-02-10',
    name: '2月分積立',
  },
  {
    id: 'tx-s6',
    type: 'expense',
    amount: 15000,
    categoryId: 'cat-11',
    categoryName: '積立：旅行費',
    transactionDate: '2025-11-01',
    name: '11月分積立',
  },
  {
    id: 'tx-s7',
    type: 'expense',
    amount: 15000,
    categoryId: 'cat-11',
    categoryName: '積立：旅行費',
    transactionDate: '2026-01-05',
    name: '1月分積立',
  },
  {
    id: 'tx-s8',
    type: 'expense',
    amount: 50000,
    categoryId: 'cat-12',
    categoryName: '積立：機材費',
    transactionDate: '2025-09-01',
    name: '9月分積立',
  },
  {
    id: 'tx-s9',
    type: 'expense',
    amount: 50000,
    categoryId: 'cat-12',
    categoryName: '積立：機材費',
    transactionDate: '2025-10-01',
    name: '10月分積立',
  },
  {
    id: 'tx-s10',
    type: 'expense',
    amount: 50000,
    categoryId: 'cat-12',
    categoryName: '積立：機材費',
    transactionDate: '2025-11-01',
    name: '11月分積立',
  },
  {
    id: 'tx-s11',
    type: 'expense',
    amount: 30000,
    categoryId: 'cat-12',
    categoryName: '積立：機材費',
    transactionDate: '2026-01-05',
    name: '1月分積立',
  },
  {
    id: 'tx-s12',
    type: 'expense',
    amount: 50000,
    categoryId: 'cat-13',
    categoryName: '積立：緊急資金',
    transactionDate: '2025-10-01',
    name: '初期積立',
  },
  {
    id: 'tx-s13',
    type: 'expense',
    amount: 50000,
    categoryId: 'cat-13',
    categoryName: '積立：緊急資金',
    transactionDate: '2025-11-01',
    name: '追加積立',
  },
  {
    id: 'tx-s14',
    type: 'expense',
    amount: 50000,
    categoryId: 'cat-13',
    categoryName: '積立：緊急資金',
    transactionDate: '2026-01-05',
    name: '追加積立',
  },
]

const savingWithdrawals: SavingWithdrawal[] = [
  {
    id: 'wdl-1',
    savingDefinitionId: 'sav-3',
    amount: 12000,
    withdrawalDate: '2025-11-15',
    memo: '旅行費の一部として使用',
    createdAt: '2025-11-15T10:30:00Z',
  },
  {
    id: 'wdl-2',
    savingDefinitionId: 'sav-4',
    amount: 10000,
    withdrawalDate: '2026-01-20',
    memo: 'カメラバッグ購入',
    createdAt: '2026-01-20T14:00:00Z',
  },
]

const SavingDetailPage: React.FC = () => {
  const { id } = Route.useParams()

  const initialSaving = savings.find((s) => s.id === id)
  const initialWithdrawals = savingWithdrawals.filter(
    (w) => w.savingDefinitionId === id,
  )
  const initialContributions = transactions
    .filter(
      (tx) =>
        tx.categoryId === initialSaving?.categoryId &&
        tx.transactionDate <= TODAY,
    )
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  const [saving, setSaving] = useState<SavingDefinition | undefined>(
    initialSaving,
  )
  const [withdrawals, setWithdrawals] =
    useState<SavingWithdrawal[]>(initialWithdrawals)
  const [contributions, setContributions] =
    useState<Transaction[]>(initialContributions)
  const [contributionOpen, setContributionOpen] = useState(false)
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (!saving) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/savings">
            <ArrowLeftIcon />
            積立一覧へ
          </Link>
        </Button>
        <p className="text-muted-foreground">積立が見つかりません。</p>
      </div>
    )
  }

  // 今月の拠出実績
  const currentMonth = TODAY.slice(0, 7)
  const thisMonthContribution = contributions
    .filter((tx) => tx.transactionDate.startsWith(currentMonth))
    .reduce((sum, tx) => sum + tx.amount, 0)

  // 拠出実行（UC-4.2）
  const handleContribute = async (
    amount: number,
    date: string,
    name: string,
  ) => {
    // モック：実際にはAPIを呼び出して支出トランザクションを作成する
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newTx: Transaction = {
      id: `tx-mock-${dayjs().valueOf()}`,
      type: 'expense',
      amount,
      categoryId: saving.categoryId,
      categoryName: saving.categoryName,
      transactionDate: date,
      name,
    }
    setContributions((prev) =>
      [...prev, newTx].sort((a, b) =>
        b.transactionDate.localeCompare(a.transactionDate),
      ),
    )
    setSaving((prev) =>
      prev ? { ...prev, balance: prev.balance + amount } : prev,
    )
  }

  // 取り崩し実行（UC-4.4）
  const handleWithdraw = async (amount: number, memo: string) => {
    // モック：実際にはAPIを呼び出して SavingWithdrawal を作成する
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const newWithdrawal: SavingWithdrawal = {
      id: `wdl-${dayjs().valueOf()}`,
      savingDefinitionId: id,
      amount,
      withdrawalDate: TODAY,
      memo: memo || undefined,
      createdAt: dayjs().toISOString(),
    }
    setWithdrawals((prev) => [...prev, newWithdrawal])
    setSaving((prev) =>
      prev ? { ...prev, balance: prev.balance - amount } : prev,
    )
  }

  // 積立設定の編集（目標額・期限の変更）
  const handleEditSave = (targetAmount: number, deadline: string) => {
    // モック：実際にはAPIを呼び出して積立定義を更新する
    const remaining = Math.max(targetAmount - saving.balance, 0)
    const monthsLeft = deadline
      ? Math.max(dayjs(deadline).diff(dayjs(TODAY), 'month'), 0)
      : null
    const newMonthlyGuide =
      deadline && monthsLeft !== null && monthsLeft > 0
        ? Math.ceil(remaining / monthsLeft)
        : undefined

    setSaving((prev) =>
      prev
        ? {
            ...prev,
            targetAmount,
            deadline: deadline || undefined,
            monthlyGuide: newMonthlyGuide,
          }
        : prev,
    )
  }

  return (
    <div className="max-w-2xl lg:max-w-full space-y-6">
      {/* ヘッダー */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link to="/savings">
            <ArrowLeftIcon />
            積立一覧へ
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{saving.categoryName}</h1>
          {saving.type === 'goal' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditOpen(true)
              }}
            >
              <PencilIcon />
              編集
            </Button>
          )}
        </div>
      </div>

      {/* 残高サマリーカード（バーンアップチャート含む） */}
      <SavingSummaryCard
        saving={saving}
        thisMonthContribution={thisMonthContribution}
        contributions={contributions}
        withdrawals={withdrawals}
      />

      {/* アクション */}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setContributionOpen(true)
          }}
        >
          <PiggyBankIcon />
          拠出する
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setWithdrawalOpen(true)
          }}
          disabled={saving.balance <= 0}
        >
          <ArrowDownLeftIcon />
          取り崩す
        </Button>
      </div>

      {/* 取り崩し履歴 */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">取り崩し履歴</h2>
        <WithdrawalHistoryTable withdrawals={withdrawals} />
      </div>

      {/* 拠出履歴 */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">拠出履歴</h2>
        <ContributionHistoryTable transactions={contributions} />
      </div>

      {/* 拠出ダイアログ */}
      <SavingContributionDialog
        open={contributionOpen}
        onOpenChange={setContributionOpen}
        categoryName={saving.categoryName}
        balance={saving.balance}
        onContribute={handleContribute}
      />

      {/* 取り崩しダイアログ */}
      <SavingWithdrawalDialog
        open={withdrawalOpen}
        onOpenChange={setWithdrawalOpen}
        balance={saving.balance}
        onWithdraw={handleWithdraw}
      />

      {/* 編集ダイアログ（goal 型のみ） */}
      {saving.type === 'goal' && (
        <SavingEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          saving={saving}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}

export const Route = createFileRoute('/savings/$id/')({
  component: SavingDetailPage,
})
