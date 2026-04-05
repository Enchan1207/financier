import type { CategoryId } from '@backend/domains/category'
import { createEvent } from '@backend/domains/event'
import { createTransaction } from '@backend/domains/transaction'
import type { UserId } from '@backend/domains/user'
import { createUser } from '@backend/domains/user'
import dayjs from '@backend/lib/date'
import { categoriesTable } from '@backend/schemas/categories'
import { eventsTable } from '@backend/schemas/events'
import { transactionsTable } from '@backend/schemas/transactions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { ulid } from 'ulid'

import { saveEventWithTransactions } from './repository'

describe('saveEventWithTransactions', () => {
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2026-04-01T10:00:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  const setupUser = async (): Promise<UserId> => {
    const user = createUser({
      email: 'test@example.com',
      idpIssuer: 'https://tenant.region.auth0.com/',
      idpSubject: `auth0|${ulid()}`,
    })
    await db.insert(usersTable).values({
      id: user.id,
      email: user.email,
      idp_iss: user.idpIssuer,
      idp_sub: user.idpSubject,
    })
    return user.id
  }

  const setupCategory = async (userId: UserId): Promise<CategoryId> => {
    const categoryId = `cat-${ulid()}` as CategoryId
    await db.insert(categoriesTable).values({
      id: categoryId,
      user_id: userId,
      type: 'expense',
      name: '食費',
      icon: 'utensils',
      color: 'red',
    })
    return categoryId
  }

  describe('正常系 - イベントとトランザクションを一括保存できる', () => {
    let userId: UserId
    let categoryId: CategoryId
    let eventId: string

    beforeAll(async () => {
      userId = await setupUser()
      categoryId = await setupCategory(userId)

      const event = createEvent({
        userId,
        name: '旅行',
        occurredOn: dayjs('2026-04-01'),
      })
      eventId = event.id

      const transaction = createTransaction({
        userId,
        type: 'expense',
        amount: 10000,
        categoryId,
        transactionDate: dayjs('2026-04-01'),
        eventId: event.id,
        name: '交通費',
      })

      await saveEventWithTransactions(db)(event, [transaction])
    })

    test('イベントが保存されること', async () => {
      const rows = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.id, eventId))
      expect(rows).toHaveLength(1)
    })

    test('イベント名が正しいこと', async () => {
      const rows = await db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.id, eventId))
      expect(rows[0]?.name).toBe('旅行')
    })

    test('トランザクションが保存されること', async () => {
      const rows = await db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.event_id, eventId))
      expect(rows).toHaveLength(1)
    })

    test('トランザクション金額が正しいこと', async () => {
      const rows = await db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.event_id, eventId))
      expect(rows[0]?.amount).toBe(10000)
    })
  })
})
