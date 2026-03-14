import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@frontend/components/ui/collapsible'
import {
  Sidebar as AppSidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@frontend/components/ui/sidebar'
import { useUser } from '@frontend/hooks/use-user'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'

import ThemeToggle from '../theme/theme-toggle'
import type { NavItem } from './nav-items'
import { filterGroupsByAuth, navGroups } from './nav-items'

const isPathActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`)

type NavMenuItemProps = {
  item: NavItem
  pathname: string
  onItemClick: () => void
}

// アコーディオン付きアイテム用コンポーネント（useState を使用するため分離）
const NavMenuCollapsibleItem: React.FC<NavMenuItemProps> = ({
  item,
  pathname,
  onItemClick,
}) => {
  const isActive = isPathActive(pathname, item.to)
  const [localOpen, setLocalOpen] = useState(isActive)

  // 子ルートがアクティブな場合は常に開いた状態を維持する
  const open = isActive || localOpen

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={(val) => {
        if (!isActive) setLocalOpen(val)
      }}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} tooltip={item.label}>
            <item.icon />
            <span>{item.label}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {(item.children ?? []).map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isPathActive(pathname, child.to)}
                  onClick={onItemClick}
                >
                  <Link to={child.to as unknown as string}>
                    {child.icon && <child.icon />}
                    <span>{child.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const NavMenuItem: React.FC<NavMenuItemProps> = ({
  item,
  pathname,
  onItemClick,
}) => {
  if (item.children && item.children.length > 0) {
    return (
      <NavMenuCollapsibleItem
        item={item}
        pathname={pathname}
        onItemClick={onItemClick}
      />
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isPathActive(pathname, item.to)}
        tooltip={item.label}
        onClick={onItemClick}
      >
        <Link to={item.to}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const Sidebar: React.FC = () => {
  const userQuery = useUser()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { isMobile, setOpenMobile } = useSidebar()
  const isAuthenticated =
    userQuery.data !== undefined && userQuery.data !== null
  const visibleGroups = filterGroupsByAuth(navGroups, isAuthenticated)

  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <AppSidebarContainer
      collapsible="icon"
      className="top-14 h-[calc(100svh-3.5rem)] md:top-16 md:h-[calc(100svh-4rem)]"
    >
      <SidebarContent>
        {visibleGroups.map((group, i) => (
          <SidebarGroup key={i}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem
                    key={item.to}
                    item={item}
                    pathname={pathname}
                    onItemClick={handleItemClick}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="items-start">
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </AppSidebarContainer>
  )
}

export default Sidebar
