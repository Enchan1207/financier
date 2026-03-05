import { savings } from '@frontend/lib/mock-data'
import { createFileRoute } from '@tanstack/react-router'

import { SavingCardDesktop } from './-components/saving-card-desktop'
import { SavingCardMobile } from './-components/saving-card-mobile'

const SavingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">積立</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {savings.map((sav) => (
          <div key={sav.id}>
            <div className="hidden lg:block h-full">
              <SavingCardDesktop
                id={sav.id}
                categoryName={sav.categoryName}
                type={sav.type}
                targetAmount={sav.targetAmount}
                deadline={sav.deadline}
                balance={sav.balance}
              />
            </div>
            <div className="lg:hidden h-full">
              <SavingCardMobile
                id={sav.id}
                categoryName={sav.categoryName}
                type={sav.type}
                targetAmount={sav.targetAmount}
                deadline={sav.deadline}
                balance={sav.balance}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/savings/')({
  component: SavingsPage,
})
