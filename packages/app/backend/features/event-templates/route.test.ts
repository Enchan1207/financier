import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import { signSessionJwt } from '@backend/features/session/jwt'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { categoriesTable } from '@backend/schemas/categories'
import {
  eventTemplateItemsTable,
  eventTemplatesTable,
} from '@backend/schemas/event-templates'
import { sessionsTable } from '@backend/schemas/sessions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'
import { ulid } from 'ulid'

import eventTemplateRoute from './route'

describe('イベントテンプレートAPI', () => {
  const client = testClient(eventTemplateRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2026-04-01T10:00:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  const setupSession = async (): Promise<{ jwt: string; userId: string }> => {
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

    const now = dayjs()
    const session = createSession({
      user,
      expiresAt: now.add(SESSION_COOKIE_AGE, 'second'),
      idpSessionId: 'idp-session-123',
    })

    await db.insert(sessionsTable).values({
      id: session.id,
      user_id: session.userId,
      issued_at: session.issuedAt.toISOString(),
      expires_at: session.expiresAt.toISOString(),
      idp_session_id: session.idpSessionId,
    })

    const jwt = await signSessionJwt(env.SESSION_SECRET)({
      sessionId: session.id,
      userId: user.id,
      now,
      expiresIn: SESSION_JWT_AGE,
    })

    return { jwt, userId: user.id }
  }

  const insertCategory = async (
    userId: string,
    overrides: Partial<{ id: string; type: string; name: string }> = {},
  ) => {
    const category = {
      id: `cat-${ulid()}`,
      user_id: userId,
      type: 'expense',
      name: '食費',
      icon: 'utensils',
      color: 'red',
      ...overrides,
    }
    await db.insert(categoriesTable).values(category)
    return category
  }

  const insertTemplate = async (
    userId: string,
    categoryId: string,
    overrides: Partial<{ id: string; name: string }> = {},
  ) => {
    const template = {
      id: `tpl-${ulid()}`,
      user_id: userId,
      name: '旅行テンプレート',
      ...overrides,
    }
    await db.insert(eventTemplatesTable).values(template)
    await db.insert(eventTemplateItemsTable).values({
      event_template_id: template.id,
      category_id: categoryId,
      name: '交通費',
      amount: 10000,
    })
    return template
  }

  describe('POST /', () => {
    describe('正常系 - テンプレートを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: { template: { id: string; name: string } }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const category = await insertCategory(userId)

        response = await client.index.$post(
          {
            json: {
              name: '旅行テンプレート',
              defaultTransactions: [
                { categoryId: category.id, name: '交通費', amount: 10000 },
              ],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('nameが正しいこと', () => {
        expect(responseBody.template.name).toBe('旅行テンプレート')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        response = await client.index.$post({
          json: {
            name: 'テスト',
            defaultTransactions: [
              { categoryId: 'cat-1', name: '費用', amount: 1000 },
            ],
          },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 積立カテゴリを指定した場合は失敗する', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const savingCategory = await insertCategory(userId, { type: 'saving' })

        response = await client.index.$post(
          {
            json: {
              name: 'テンプレート',
              defaultTransactions: [
                { categoryId: savingCategory.id, name: '積立', amount: 5000 },
              ],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })
  })

  describe('PUT /:id', () => {
    describe('正常系 - テンプレートを更新できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>
      let responseBody: { template: { name: string } }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const category = await insertCategory(userId)
        const template = await insertTemplate(userId, category.id)

        response = await client[':id'].$put(
          {
            param: { id: template.id },
            json: { name: '更新後テンプレート' },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('nameが更新されること', () => {
        expect(responseBody.template.name).toBe('更新後テンプレート')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        response = await client[':id'].$put({
          param: { id: 'any-id' },
          json: { name: 'テスト' },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないテンプレートIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        const { jwt } = await setupSession()

        response = await client[':id'].$put(
          {
            param: { id: 'non-existent-template-id-00001' },
            json: { name: 'テスト' },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })

  describe('DELETE /:id', () => {
    describe('正常系 - テンプレートを削除できる', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>
      let responseBody: { template: { id: string } }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const category = await insertCategory(userId)
        const template = await insertTemplate(userId, category.id)

        response = await client[':id'].$delete(
          { param: { id: template.id } },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('削除されたテンプレートのIDが返ること', () => {
        expect(responseBody.template.id).toBeDefined()
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        response = await client[':id'].$delete({ param: { id: 'any-id' } })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないテンプレートIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const { jwt } = await setupSession()

        response = await client[':id'].$delete(
          { param: { id: 'non-existent-template-id-00001' } },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })

  describe('POST /:id/register', () => {
    describe('正常系 - イベントとトランザクションを一括登録できる', () => {
      let response: Awaited<
        ReturnType<(typeof client)[':id']['register']['$post']>
      >
      let responseBody: { eventId: string }

      beforeAll(async () => {
        const { jwt, userId } = await setupSession()
        const category = await insertCategory(userId)
        const template = await insertTemplate(userId, category.id)

        response = await client[':id']['register'].$post(
          {
            param: { id: template.id },
            json: {
              occurredOn: '2026-04-01',
              items: [
                { categoryId: category.id, name: '交通費', amount: 15000 },
              ],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('eventIdが返ること', () => {
        expect(responseBody.eventId).toBeDefined()
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<
        ReturnType<(typeof client)[':id']['register']['$post']>
      >

      beforeAll(async () => {
        response = await client[':id']['register'].$post({
          param: { id: 'any-id' },
          json: {
            occurredOn: '2026-04-01',
            items: [{ categoryId: 'cat-1', name: '費用', amount: 1000 }],
          },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないテンプレートIDを指定', () => {
      let response: Awaited<
        ReturnType<(typeof client)[':id']['register']['$post']>
      >

      beforeAll(async () => {
        const { jwt } = await setupSession()

        response = await client[':id']['register'].$post(
          {
            param: { id: 'non-existent-template-id-00001' },
            json: {
              occurredOn: '2026-04-01',
              items: [{ categoryId: 'cat-1', name: '費用', amount: 1000 }],
            },
          },
          { headers: { Cookie: `__Host-Http-session=${jwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })
  })
})
