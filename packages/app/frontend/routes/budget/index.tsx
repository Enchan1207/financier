import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/budget/')({
  beforeLoad: () => {
    throw redirect({ to: '/budget/$year', params: { year: '2026' } })
  },
})
