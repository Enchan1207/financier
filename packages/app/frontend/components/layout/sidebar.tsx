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
  SidebarRail,
  useSidebar,
} from '@frontend/components/ui/sidebar'
import { useUser } from '@frontend/hooks/use-user'
import { Link, useRouterState } from '@tanstack/react-router'

import ThemeToggle from '../theme/theme-toggle'
import { filterGroupsByAuth, navGroups } from './nav-items'

const isPathActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`)

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
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isPathActive(pathname, item.to)}
                      tooltip={item.label}
                      onClick={handleItemClick}
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
