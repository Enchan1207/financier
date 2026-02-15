import * as React from 'react'
import { Slot } from 'radix-ui'
import { PanelLeft } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@frontend/lib/shadcn-ui-utils'
import { Button } from '@frontend/components/ui/button'

type SidebarContextValue = {
  isMobile: boolean
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mediaQuery.matches)

    onChange()
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar は SidebarProvider 内で使用してください')
  }
  return context
}

function SidebarProvider({
  defaultOpen = true,
  children,
}: {
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((current) => !current)
      return
    }
    setOpen((current) => !current)
  }, [isMobile])

  const value = React.useMemo(
    () => ({
      isMobile,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [isMobile, open, openMobile, toggleSidebar],
  )

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

function Sidebar({
  className,
  children,
  ...props
}: React.ComponentProps<'aside'>) {
  const { isMobile, open, openMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <>
        {openMobile ? (
          <button
            type="button"
            aria-label="サイドバーを閉じる"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setOpenMobile(false)}
          />
        ) : null}
        <aside
          data-slot="sidebar"
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:hidden',
            openMobile ? 'translate-x-0' : '-translate-x-full',
            className,
          )}
          {...props}
        >
          <div className="flex h-full flex-col">{children}</div>
        </aside>
      </>
    )
  }

  return (
    <aside
      data-slot="sidebar"
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all md:block',
        open ? 'w-64' : 'w-0 overflow-hidden border-r-0',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-full w-64 flex-col transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {children}
      </div>
    </aside>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn('min-w-0 flex-1', className)}
      {...props}
    />
  )
}

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('size-8', className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">サイドバーを切り替える</span>
    </Button>
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="sidebar-group-label"
      className={cn(
        'px-2 py-1 text-muted-foreground text-xs font-medium',
        className,
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn('list-none', className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  'flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50',
)

function SidebarMenuButton({
  className,
  asChild = false,
  isActive = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    asChild?: boolean
    isActive?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants(), className)}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
