import type { CategoryId } from '@backend/domains/category'
import {
  createExpenseCategory,
  createIncomeCategory,
  createSavingCategory,
} from '@backend/domains/category'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { zValidator } from '@hono/zod-validator'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'
import { match } from 'ts-pattern'

import { deleteCategory, findCategoryById, saveCategory } from './repository'
import {
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
} from './schema'
import { buildUpdateCategoryWorkflow } from './workflows/update'

type CategoryResponse = {
  id: string
  type: 'income' | 'expense' | 'saving'
  name: string
  icon: string
  color: string
}

const toCategoryResponse = (category: {
  id: string
  type: string
  name: string
  icon: string
  color: string
}): CategoryResponse => ({
  id: category.id,
  type: category.type as CategoryResponse['type'],
  name: category.name,
  icon: category.icon,
  color: category.color,
})

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .post('/', zValidator('json', CreateCategoryRequestSchema), async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const { type, name, icon, color } = c.req.valid('json')
    const db = c.get('db')
    const userId = session.userId

    const category =
      type === 'income'
        ? createIncomeCategory({
            type: 'income',
            userId,
            name,
            icon,
            color,
          })
        : type === 'saving'
          ? createSavingCategory({
              type: 'saving',
              userId,
              name,
              icon,
              color,
            })
          : createExpenseCategory({
              type: 'expense',
              userId,
              name,
              icon,
              color,
            })

    await saveCategory(db)(category)

    return c.json({ category: toCategoryResponse(category) }, 201)
  })
  .put('/:id', zValidator('json', UpdateCategoryRequestSchema), async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as CategoryId
    const body = c.req.valid('json')
    const db = c.get('db')

    const workflow = buildUpdateCategoryWorkflow({
      findCategoryById: findCategoryById(db),
    })

    const result = await workflow({
      input: { id, ...body },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      return c.json({ message: result.error.message }, 404)
    }

    await saveCategory(db)(result.value.category)

    return c.json({ category: toCategoryResponse(result.value.category) })
  })
  .delete('/:id', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as CategoryId
    const db = c.get('db')

    const deleteResult = await deleteCategory(db)(id, session.userId)
    if (Result.isSuccess(deleteResult)) {
      const deleted = deleteResult.value
      console.log(`カテゴリ ${deleted.id} は削除されました。`, { deleted })
      return c.body(null, 204)
    }

    return match(deleteResult.error)
      .with({ name: 'CategoryNotFoundException' }, () => {
        console.error(`カテゴリ ${id} が見つかりません`)
        return c.json({ message: 'no such category' }, 404)
      })
      .with({ name: 'CategoryRelationException' }, () => {
        console.error(
          `カテゴリ ${id} は他のデータから参照されているため、削除できません`,
        )

        return c.json(
          {
            message: 'category is related to other entities',
          },
          409,
        )
      })
      .otherwise((e: unknown) => {
        console.error(`カテゴリ ${id} 削除時の不明なエラー`, { cause: e })
        return c.json({ message: 'unknown error' }, 500)
      })
  })

export default app
