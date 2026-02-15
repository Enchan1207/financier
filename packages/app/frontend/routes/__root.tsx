import { AppHeader } from '@frontend/components/layout/app-header'
import { AppSidebar } from '@frontend/components/layout/app-sidebar'
import { Separator } from '@frontend/components/ui/separator'
import { MockFinanceProvider } from '@frontend/hooks/use-mock-finance-store'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

const RootLayout = () => {
  return (
    <MockFinanceProvider>
      <div className="min-h-dvh bg-muted/30">
        <AppHeader />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:px-6">
          <AppSidebar />

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>

        <Separator />
        <TanStackRouterDevtools />
      </div>
    </MockFinanceProvider>
  )
}

export const Route = createRootRoute({ component: RootLayout })
