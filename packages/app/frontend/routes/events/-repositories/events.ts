import { client } from '@frontend/lib/client'
import type { InferRequestType, InferResponseType } from 'hono/client'

export type EventSummaryItem = InferResponseType<
  typeof client.pages.events.$get,
  200
>['events'][number]

export type EventDetailItem = InferResponseType<
  (typeof client.pages.events)[':id']['$get'],
  200
>['event']

const fetchEvents = async (): Promise<EventSummaryItem[]> => {
  const response = await client.pages.events.$get()
  if (!response.ok) {
    throw new Error('イベントの取得に失敗しました')
  }
  const data = await response.json()
  return data.events
}

export const listEventsQueryOptions = () => ({
  queryKey: ['events'] as const,
  queryFn: fetchEvents,
})

const fetchEventDetail = async (id: string): Promise<EventDetailItem> => {
  const response = await client.pages.events[':id'].$get({ param: { id } })
  if (!response.ok) {
    throw new Error('イベントの取得に失敗しました')
  }
  const data = await response.json()
  return data.event
}

export const eventDetailQueryOptions = (id: string) => ({
  queryKey: ['events', id] as const,
  queryFn: () => fetchEventDetail(id),
})

export const createEvent = async (
  body: InferRequestType<typeof client.events.$post>['json'],
): Promise<InferResponseType<typeof client.events.$post, 201>['event']> => {
  const response = await client.events.$post({ json: body })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'イベントの作成に失敗しました',
    )
  }
  const data = await response.json()
  return data.event
}

export const updateEvent = async (
  id: string,
  body: InferRequestType<(typeof client.events)[':id']['$put']>['json'],
): Promise<
  InferResponseType<(typeof client.events)[':id']['$put'], 200>['event']
> => {
  const response = await client.events[':id'].$put({
    param: { id },
    json: body,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'イベントの更新に失敗しました',
    )
  }
  const data = await response.json()
  return data.event
}

export const deleteEvent = async (id: string): Promise<void> => {
  const response = await client.events[':id'].$delete({ param: { id } })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      'message' in error ? error.message : 'イベントの削除に失敗しました',
    )
  }
}
