import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@frontend/components/ui/sidebar'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  ChartColumnBig,
  CircleDollarSign,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Tags,
  WalletCards,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/transactions', label: '取引', icon: ReceiptText },
  { to: '/categories', label: 'カテゴリ', icon: Tags },
  { to: '/budgets', label: '予算', icon: WalletCards },
  { to: '/savings', label: '積立', icon: PiggyBank },
  { to: '/events', label: 'イベント', icon: CircleDollarSign },
  { to: '/analytics', label: '分析', icon: ChartColumnBig },
] as const

const isPathActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`)

export const AppSidebar = () => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(pathname, item.to)}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="border-sidebar-border border-t p-3">
        <p className="text-muted-foreground text-xs">financier</p>
        <p className="text-sm font-medium">個人財務マネジメント</p>
      </div>
    </Sidebar>
  )
}
