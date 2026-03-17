import { client } from '@frontend/lib/client'
import type { InferRequestType, InferResponseType } from 'hono/client'

export type CategoryItem = InferResponseType<
  typeof client.categories.$get,
  200
>['categories'][number]

const fetchCategories = async (): Promise<CategoryItem[]> => {
  const response = await client.categories.$get()
  if (!response.ok) {
    throw new Error('カテゴリの取得に失敗しました')
  }
  const data = await response.json()
  return data.categories
}

export const listCategoriesQueryOptions = () => ({
  queryKey: ['categories'] as const,
  queryFn: fetchCategories,
})

export const createCategory = async (
  body: InferRequestType<typeof client.categories.$post>['json'],
): Promise<CategoryItem> => {
  const response = await client.categories.$post({ json: body })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'カテゴリの作成に失敗しました',
    )
  }
  const data = await response.json()
  return data.category
}

export const updateCategory = async (
  id: string,
  body: InferRequestType<(typeof client.categories)[':id']['$put']>['json'],
): Promise<CategoryItem> => {
  const response = await client.categories[':id'].$put({
    param: { id },
    json: body,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'カテゴリの更新に失敗しました',
    )
  }
  const data = await response.json()
  return data.category
}

export const archiveCategory = async (id: string): Promise<CategoryItem> => {
  const response = await client.categories[':id'].$delete({
    param: { id },
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'カテゴリの削除に失敗しました',
    )
  }
  const data = await response.json()
  return data.category
}
