import ModeToggle from '@frontend/components/theme/theme-toggle'

export const AppHeader = () => {
  return (
    <header className="border-b bg-background/70">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 md:px-6">
        <div className="flex items-start gap-3">
          <div>
            <p className="text-muted-foreground text-xs">financier / mock</p>
            <h1 className="text-base font-semibold">個人財務マネジメント</h1>
          </div>
        </div>
        <ModeToggle />
      </div>
    </header>
  )
}
