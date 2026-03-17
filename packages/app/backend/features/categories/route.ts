import type { CategoryId } from '@backend/domains/category'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { dbMiddleware } from '@backend/middlewares/db'
import { zValidator } from '@hono/zod-validator'
import { Result } from '@praha/byethrow'
import { Hono } from 'hono'

import {
  CategoryConflictException,
  CategoryNotFoundException,
} from './exceptions'
import {
  archiveCategory,
  findCategories,
  findCategoryById,
  findCategoryByName,
  saveCategory,
} from './repository'
import {
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
} from './schema'
import { buildArchiveCategoryWorkflow } from './workflows/archive'
import { buildCreateCategoryWorkflow } from './workflows/create'
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
  .use(dbMiddleware)
  .get('/', async (c) => {
    if (c.get('session') === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const categories = await findCategories(c.get('db'))()
    return c.json({ categories: categories.map(toCategoryResponse) })
  })
  .post('/', zValidator('json', CreateCategoryRequestSchema), async (c) => {
    if (c.get('session') === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const body = c.req.valid('json')
    const db = c.get('db')

    const workflow = buildCreateCategoryWorkflow({
      findCategoryByName: findCategoryByName(db),
    })

    const result = await workflow(body)

    if (Result.isFailure(result)) {
      return c.json({ message: result.error.message }, 409)
    }

    await saveCategory(db)(result.value.category)

    return c.json({ category: toCategoryResponse(result.value.category) }, 201)
  })
  .put('/:id', zValidator('json', UpdateCategoryRequestSchema), async (c) => {
    if (c.get('session') === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as CategoryId
    const body = c.req.valid('json')
    const db = c.get('db')

    const workflow = buildUpdateCategoryWorkflow({
      findCategoryById: findCategoryById(db),
      findCategoryByName: findCategoryByName(db),
    })

    const result = await workflow({ id, ...body })

    if (Result.isFailure(result)) {
      if (result.error instanceof CategoryNotFoundException) {
        return c.json({ message: result.error.message }, 404)
      }
      if (result.error instanceof CategoryConflictException) {
        return c.json({ message: result.error.message }, 409)
      }
      return c.json({ message: result.error.message }, 400)
    }

    await saveCategory(db)(result.value.category)

    return c.json({ category: toCategoryResponse(result.value.category) })
  })
  .delete('/:id', async (c) => {
    if (c.get('session') === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id') as CategoryId
    const db = c.get('db')

    const workflow = buildArchiveCategoryWorkflow({
      findCategoryById: findCategoryById(db),
    })

    const result = await workflow({ id })

    if (Result.isFailure(result)) {
      if (result.error instanceof CategoryNotFoundException) {
        return c.json({ message: result.error.message }, 404)
      }
      return c.json({ message: result.error.message }, 409)
    }

    await archiveCategory(db)(id)

    return c.json({ category: toCategoryResponse(result.value.category) })
  })

export default app
