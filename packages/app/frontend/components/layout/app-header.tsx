import ModeToggle from '@frontend/components/theme/theme-toggle'
import { SidebarTrigger } from '@frontend/components/ui/sidebar'

export const AppHeader = () => {
  return (
    <header className="border-b bg-background/70">
      <div className="flex w-full items-center gap-3 px-4 py-2 md:px-6">
        <div className="flex items-center gap-3 text-left">
          <SidebarTrigger />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">financier</h1>
          </div>
        </div>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
