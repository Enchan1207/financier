import { Button } from '@frontend/components/ui/button'
import dayjs from '@frontend/lib/date'
import type {
  SavingDefinition,
  SavingWithdrawal,
  Transaction,
} from '@frontend/lib/mock-data'
import {
  savings,
  savingWithdrawals,
  TODAY,
  transactions,
} from '@frontend/lib/mock-data'
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
  const handleContribute = (amount: number, date: string, name: string) => {
    // モック：実際にはAPIを呼び出して支出トランザクションを作成する
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
    setContributionOpen(false)
  }

  // 取り崩し実行（UC-4.4）
  const handleWithdraw = (amount: number, memo: string) => {
    // モック：実際にはAPIを呼び出して SavingWithdrawal を作成する
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
    setWithdrawalOpen(false)
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
