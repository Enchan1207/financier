import { Button } from '@frontend/components/ui/button'
import { Link } from '@tanstack/react-router'

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/transactions', label: '取引' },
  { to: '/categories', label: 'カテゴリ' },
  { to: '/budgets', label: '予算' },
  { to: '/savings', label: '積立' },
  { to: '/events', label: 'イベント' },
  { to: '/analytics', label: '分析' },
] as const

export const FinanceNavigation = () => {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {navItems.map((item) => (
        <Button key={item.to} asChild size="sm" variant="outline">
          <Link to={item.to}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  )
}
