import { createFileRoute } from '@tanstack/react-router'

import { CategoryPage } from './-category-page'

export const Route = createFileRoute('/categories/expense')({
  component: ExpenseCategoriesPage,
})

function ExpenseCategoriesPage() {
  return <CategoryPage typeFilter="expense" />
}
