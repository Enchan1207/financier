import type { FileRouteTypes } from '@frontend/routeTree.gen'
import { CalendarDays, Home, PiggyBank, Receipt, Wallet } from 'lucide-react'

export type NavVisibility = 'public' | 'authenticated'

export type NavItem = {
  to: FileRouteTypes['to']
  label: string
  icon: React.ComponentType<{ className?: string }>
  visibility: NavVisibility
}

export type NavGroup = {
  label?: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'ホーム', icon: Home, visibility: 'public' },
      { to: '/transactions', label: '取引一覧', icon: Receipt, visibility: 'public' },
    ],
  },
  {
    label: '管理',
    items: [
      { to: '/budget', label: '予算', icon: Wallet, visibility: 'public' },
      { to: '/savings', label: '積立', icon: PiggyBank, visibility: 'public' },
      { to: '/events', label: 'イベント', icon: CalendarDays, visibility: 'public' },
    ],
  },
]

export const filterGroupsByAuth = (
  groups: NavGroup[],
  isAuthenticated: boolean,
): NavGroup[] =>
  groups.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      item.visibility === 'authenticated' ? isAuthenticated : true,
    ),
  }))

// backward compat
export const navItems = navGroups.flatMap((g) => g.items)
export const filterNavItemsByAuth = (
  items: NavItem[],
  isAuthenticated: boolean,
): NavItem[] =>
  items.filter((item) =>
    item.visibility === 'authenticated' ? isAuthenticated : true,
  )
