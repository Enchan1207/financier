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

import { CategoryNotFoundException } from './exceptions'
import {
  archiveCategory,
  findCategories,
  findCategoryById,
  saveCategory,
} from './repository'
import {
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
} from './schema'
import { buildArchiveCategoryWorkflow } from './workflows/archive'
import { buildUpdateCategoryWorkflow } from './workflows/update'

type CategoryResponse = {
  id: string
  type: 'income' | 'expense' | 'saving'
  name: string
  status: 'active' | 'archived'
  icon: string
  color: string
}

const toCategoryResponse = (category: {
  id: string
  type: string
  name: string
  status: string
  icon: string
  color: string
}): CategoryResponse => ({
  id: category.id,
  type: category.type as CategoryResponse['type'],
  name: category.name,
  status: category.status as CategoryResponse['status'],
  icon: category.icon,
  color: category.color,
})

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .get('/', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const categories = await findCategories(c.get('db'))(session.userId)
    return c.json({ categories: categories.map(toCategoryResponse) })
  })
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
      if (result.error instanceof CategoryNotFoundException) {
        return c.json({ message: result.error.message }, 404)
      }
      return c.json({ message: result.error.message }, 400)
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

    const workflow = buildArchiveCategoryWorkflow({
      findCategoryById: findCategoryById(db),
    })

    const result = await workflow({
      input: { id },
      context: { userId: session.userId },
    })

    if (Result.isFailure(result)) {
      if (result.error instanceof CategoryNotFoundException) {
        return c.json({ message: result.error.message }, 404)
      }
      return c.json({ message: result.error.message }, 409)
    }

    await archiveCategory(db)(result.value.category.id)

    return c.json({ category: toCategoryResponse(result.value.category) })
  })

export default app
