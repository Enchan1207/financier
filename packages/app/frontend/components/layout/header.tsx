import { AddTransactionDialog } from '@frontend/components/transaction/add-transaction-dialog'
import { Button } from '@frontend/components/ui/button'
import { SidebarTrigger } from '@frontend/components/ui/sidebar'
import { Plus } from 'lucide-react'

import AccountMenu from '../account/account-menu'

const Header: React.FC = () => {
  return (
    <header className="bg-accent relative z-20 w-full p-2 shadow md:p-4 sticky top-0">
      <div className="flex flex-row items-center">
        <SidebarTrigger className="mr-1 h-8 w-8" />
        <div className="flex-1 text-base font-semibold md:text-xl">
          Financier
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <AddTransactionDialog
            trigger={
              <Button size="sm" className="hidden sm:flex">
                <Plus />
                取引を追加
              </Button>
            }
          />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}

export default Header
