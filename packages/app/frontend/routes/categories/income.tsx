import { createFileRoute } from '@tanstack/react-router'

import { CategoryPage } from './-category-page'

export const Route = createFileRoute('/categories/income')({
  component: IncomeCategoriesPage,
})

function IncomeCategoriesPage() {
  return <CategoryPage typeFilter="income" />
}
