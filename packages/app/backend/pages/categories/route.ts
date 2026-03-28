import { findCategories } from '@backend/features/categories/repository'
import { sessionMiddleware } from '@backend/features/session/middleware'
import { Hono } from 'hono'

type CategoryListItemResponse = {
  id: string
  type: 'income' | 'expense' | 'saving'
  name: string
  icon: string
  color: string
}

const app = new Hono<{ Bindings: Env }>()
  .use(sessionMiddleware)
  .get('/', async (c) => {
    const session = c.get('session')
    if (session === undefined) {
      return c.json({ message: 'Unauthorized' }, 401)
    }

    const categories = await findCategories(c.get('db'))(session.userId)

    const items: CategoryListItemResponse[] = categories.map((cat) => ({
      id: cat.id,
      type: cat.type,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
    }))

    return c.json({ categories: items })
  })

export default app
