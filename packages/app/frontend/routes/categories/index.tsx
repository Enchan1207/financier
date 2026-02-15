import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/categories/')({
  beforeLoad: () => {
    return redirect({ to: '/categories/expense' })
  },
})
