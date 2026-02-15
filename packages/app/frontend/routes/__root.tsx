import { AppHeader } from '@frontend/components/layout/app-header'
import { AppSidebar } from '@frontend/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@frontend/components/ui/sidebar'
import { MockFinanceProvider } from '@frontend/hooks/use-mock-finance-store'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

const RootLayout = () => {
  return (
    <MockFinanceProvider>
      <SidebarProvider defaultOpen>
        <div className="flex min-h-dvh w-full flex-col bg-muted/30">
          <AppHeader />
          <div className="flex min-h-0 flex-1">
            <AppSidebar />

            <SidebarInset>
              <main className="mx-auto min-w-0 w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </div>
        <TanStackRouterDevtools />
      </SidebarProvider>
    </MockFinanceProvider>
  )
}

export const Route = createRootRoute({ component: RootLayout })
