import { createSession } from '@backend/domains/session'
import { createUser } from '@backend/domains/user'
import { signSessionJwt } from '@backend/features/session/jwt'
import dayjs from '@backend/lib/date'
import {
  SESSION_COOKIE_AGE,
  SESSION_JWT_AGE,
} from '@backend/lib/session-config'
import { categoriesTable } from '@backend/schemas/categories'
import { sessionsTable } from '@backend/schemas/sessions'
import { usersTable } from '@backend/schemas/users'
import { env } from 'cloudflare:test'
import { drizzle } from 'drizzle-orm/d1'
import { testClient } from 'hono/testing'

import categoriesRoute from './route'

describe('カテゴリAPI', () => {
  const client = testClient(categoriesRoute, env)
  const db = drizzle(env.D1)

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(dayjs('2022-11-01T18:05:00Z').toDate())
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  // セッション付きクッキーを生成するヘルパー
  const setupSession = async (): Promise<string> => {
    const user = createUser({
      email: 'test@example.com',
      idpIssuer: 'https://tenant.region.auth0.com/',
      idpSubject: 'auth0|123456',
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

    return signSessionJwt(env.SESSION_SECRET)({
      sessionId: session.id,
      userId: user.id,
      now,
      expiresIn: SESSION_JWT_AGE,
    })
  }

  describe('GET /', () => {
    describe('正常系', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>
      let responseBody: { categories: unknown[] }

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        await db.insert(categoriesTable).values([
          {
            id: 'test-category-id-get-000001',
            type: 'income',
            name: '給与',
            status: 'active',
            icon: 'briefcase',
            color: 'green',
          },
          {
            id: 'test-category-id-get-000002',
            type: 'expense',
            name: '食費',
            status: 'active',
            icon: 'utensils',
            color: 'red',
          },
        ])

        response = await client.index.$get(
          {},
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as { categories: unknown[] }
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('カテゴリ一覧が返ること', () => {
        expect(responseBody.categories).toHaveLength(2)
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$get>>

      beforeAll(async () => {
        response = await client.index.$get({})
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })
  })

  describe('POST /', () => {
    describe('正常系 - incomeカテゴリを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: {
        category: {
          id: string
          type: string
          name: string
          status: string
          icon: string
          color: string
        }
      }

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'income',
              name: '副業収入',
              icon: 'wallet',
              color: 'blue',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('作成されたカテゴリのtypeがincomeであること', () => {
        expect(responseBody.category.type).toBe('income')
      })

      test('作成されたカテゴリのnameが正しいこと', () => {
        expect(responseBody.category.name).toBe('副業収入')
      })

      test('作成されたカテゴリのstatusがactiveであること', () => {
        expect(responseBody.category.status).toBe('active')
      })

      test('作成されたカテゴリのIDが存在すること', () => {
        expect(responseBody.category.id).toBeDefined()
      })
    })

    describe('正常系 - expenseカテゴリを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: { category: { type: string } }

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'expense',
              name: '交通費',
              icon: 'bus',
              color: 'yellow',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('作成されたカテゴリのtypeがexpenseであること', () => {
        expect(responseBody.category.type).toBe('expense')
      })
    })

    describe('正常系 - savingカテゴリを作成できる', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>
      let responseBody: { category: { type: string } }

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'saving',
              name: '積立貯金',
              icon: 'piggy_bank',
              color: 'pink',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('201が返ること', () => {
        expect(response.status).toBe(201)
      })

      test('作成されたカテゴリのtypeがsavingであること', () => {
        expect(responseBody.category.type).toBe('saving')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        response = await client.index.$post({
          json: {
            type: 'income',
            name: '給与',
            icon: 'briefcase',
            color: 'green',
          },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 不正なリクエストボディ（nameが空）', () => {
      let response: Awaited<ReturnType<typeof client.index.$post>>

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        response = await client.index.$post(
          {
            json: {
              type: 'income',
              name: '   ',
              icon: 'briefcase',
              color: 'green',
            },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })
  })

  describe('PUT /:id', () => {
    describe('正常系 - アクティブなカテゴリを更新できる', () => {
      const categoryId = 'test-category-id-put-000001'
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>
      let responseBody: {
        category: {
          id: string
          name: string
          icon: string
          color: string
          status: string
        }
      }

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          type: 'expense',
          name: '食費',
          status: 'active',
          icon: 'utensils',
          color: 'red',
        })

        response = await client[':id'].$put(
          {
            param: { id: categoryId },
            json: { name: '外食費', icon: 'coffee', color: 'orange' },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('nameが更新されること', () => {
        expect(responseBody.category.name).toBe('外食費')
      })

      test('iconが更新されること', () => {
        expect(responseBody.category.icon).toBe('coffee')
      })

      test('colorが更新されること', () => {
        expect(responseBody.category.color).toBe('orange')
      })

      test('statusがactiveのままであること', () => {
        expect(responseBody.category.status).toBe('active')
      })
    })

    describe('異常系 - セッションなし', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        response = await client[':id'].$put({
          param: { id: 'any-id' },
          json: { name: '更新', icon: 'tag', color: 'blue' },
        })
      })

      test('401が返ること', () => {
        expect(response.status).toBe(401)
      })
    })

    describe('異常系 - 存在しないカテゴリIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        response = await client[':id'].$put(
          {
            param: { id: 'non-existent-category-id-000' },
            json: { name: '更新', icon: 'tag', color: 'blue' },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })

    describe('異常系 - アーカイブ済みカテゴリは更新できない', () => {
      const categoryId = 'test-category-id-put-000002'
      let response: Awaited<ReturnType<(typeof client)[':id']['$put']>>

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          type: 'income',
          name: '給与',
          status: 'archived',
          icon: 'briefcase',
          color: 'green',
        })

        response = await client[':id'].$put(
          {
            param: { id: categoryId },
            json: { name: '給与収入', icon: 'wallet', color: 'teal' },
          },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('400が返ること', () => {
        expect(response.status).toBe(400)
      })
    })
  })

  describe('DELETE /:id', () => {
    describe('正常系 - アクティブなカテゴリをアーカイブできる', () => {
      const categoryId = 'test-category-id-del-000001'
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>
      let responseBody: { category: { status: string } }

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          type: 'saving',
          name: '積立貯金',
          status: 'active',
          icon: 'piggy_bank',
          color: 'pink',
        })

        response = await client[':id'].$delete(
          { param: { id: categoryId } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
        responseBody = (await response.json()) as typeof responseBody
      })

      test('200が返ること', () => {
        expect(response.status).toBe(200)
      })

      test('レスポンスのstatusがarchivedになること', () => {
        expect(responseBody.category.status).toBe('archived')
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

    describe('異常系 - 存在しないカテゴリIDを指定', () => {
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        response = await client[':id'].$delete(
          { param: { id: 'non-existent-category-id-000' } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('404が返ること', () => {
        expect(response.status).toBe(404)
      })
    })

    describe('異常系 - すでにアーカイブ済みのカテゴリ', () => {
      const categoryId = 'test-category-id-del-000002'
      let response: Awaited<ReturnType<(typeof client)[':id']['$delete']>>

      beforeAll(async () => {
        const sessionJwt = await setupSession()

        await db.insert(categoriesTable).values({
          id: categoryId,
          type: 'expense',
          name: '食費',
          status: 'archived',
          icon: 'utensils',
          color: 'red',
        })

        response = await client[':id'].$delete(
          { param: { id: categoryId } },
          { headers: { Cookie: `__Host-Http-session=${sessionJwt}` } },
        )
      })

      test('409が返ること', () => {
        expect(response.status).toBe(409)
      })
    })
  })
})
