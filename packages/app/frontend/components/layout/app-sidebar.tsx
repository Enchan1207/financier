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

export const AppSidebar = () => {
  return (
    <aside className="w-full md:sticky md:top-6 md:w-56">
      <div className="rounded-lg border bg-background p-3">
        <p className="mb-2 text-muted-foreground text-xs">画面遷移</p>
        <nav className="flex flex-col items-stretch gap-2">
          {navItems.map((item) => (
            <Button
              key={item.to}
              asChild
              size="sm"
              variant="outline"
              className="justify-start"
            >
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
