import { FinanceNavigation } from '@frontend/components/finance-navigation'
import { Separator } from '@frontend/components/ui/separator'
import { MockFinanceProvider } from '@frontend/hooks/use-mock-finance-store'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

const RootLayout = () => {
  return (
    <MockFinanceProvider>
      <div className="min-h-dvh bg-muted/30">
        <header className="border-b bg-background/90">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-6">
            <div>
              <p className="text-muted-foreground text-sm">financier / mock</p>
              <h1 className="text-xl font-semibold">個人財務マネジメント</h1>
            </div>
            <FinanceNavigation />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
          <Outlet />
        </main>

        <Separator />
        <TanStackRouterDevtools />
      </div>
    </MockFinanceProvider>
  )
}

export const Route = createRootRoute({ component: RootLayout })
