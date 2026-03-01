import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/budget/')({
  beforeLoad: () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/budget/$year', params: { year: '2026' } })
  },
})
