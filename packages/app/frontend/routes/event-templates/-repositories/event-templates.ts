import { client } from '@frontend/lib/client'
import type { InferRequestType, InferResponseType } from 'hono/client'

export type EventTemplateSummary = InferResponseType<
  (typeof client.pages)['event-templates']['$get'],
  200
>['templates'][number]

export type EventTemplateDetail = NonNullable<
  InferResponseType<
    (typeof client.pages)['event-templates'][':id']['$get'],
    200
  >['template']
>

const fetchEventTemplates = async (): Promise<EventTemplateSummary[]> => {
  const response = await client.pages['event-templates'].$get()
  if (!response.ok) {
    throw new Error('テンプレートの取得に失敗しました')
  }
  const data = await response.json()
  return data.templates
}

export const listEventTemplatesQueryOptions = () => ({
  queryKey: ['event-templates'] as const,
  queryFn: fetchEventTemplates,
})

const fetchEventTemplateDetail = async (
  id: string,
): Promise<EventTemplateDetail | null> => {
  const response = await client.pages['event-templates'][':id'].$get({
    param: { id },
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('テンプレートの取得に失敗しました')
  }
  const data = await response.json()
  return data.template
}

export const getEventTemplateDetailQueryOptions = (id: string) => ({
  queryKey: ['event-templates', id] as const,
  queryFn: () => fetchEventTemplateDetail(id),
})

export const createEventTemplate = async (
  body: InferRequestType<(typeof client)['event-templates']['$post']>['json'],
): Promise<void> => {
  const response = await client['event-templates'].$post({ json: body })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'テンプレートの作成に失敗しました',
    )
  }
}

export const updateEventTemplate = async (
  id: string,
  body: InferRequestType<
    (typeof client)['event-templates'][':id']['$put']
  >['json'],
): Promise<void> => {
  const response = await client['event-templates'][':id'].$put({
    param: { id },
    json: body,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'テンプレートの更新に失敗しました',
    )
  }
}

export const deleteEventTemplate = async (id: string): Promise<void> => {
  const response = await client['event-templates'][':id'].$delete({
    param: { id },
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'テンプレートの削除に失敗しました',
    )
  }
}

export const registerEventTemplate = async (
  id: string,
  body: InferRequestType<
    (typeof client)['event-templates'][':id']['register']['$post']
  >['json'],
): Promise<void> => {
  const response = await client['event-templates'][':id']['register'].$post({
    param: { id },
    json: body,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : '一括登録に失敗しました',
    )
  }
}
