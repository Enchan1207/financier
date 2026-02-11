import { useAuth0 } from '@auth0/auth0-react'
import type { InferResponseType } from 'hono'
import { useState } from 'react'

import { client } from './client'

type ListItem = InferResponseType<typeof client.posts.$get>['items'][number]

export const PostList: React.FC = () => {
  // TODO: クレデンシャル管理どうにかする
  const { getAccessTokenSilently } = useAuth0()

  const [items, setItems] = useState<ListItem[]>([])

  const loadItems = async () => {
    const token = await getAccessTokenSilently()

    const response = await client.posts
      .$get(undefined, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => (res.ok ? res.json() : undefined))

    if (response === undefined) {
      return
    }

    setItems(response.items)
  }

  const lookupItem = async (id: string) => {
    const token = await getAccessTokenSilently()

    const response = await client.posts[':id']
      .$get(
        { param: { id } },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .then((res) => (res.ok ? res.json() : undefined))

    if (response === undefined) {
      alert('エラーが発生しました')
      return
    }

    alert(response.content)
  }

  return (
    <>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.title}
            <button onClick={() => lookupItem(item.id)}>lookup</button>
          </li>
        ))}
      </ul>
      <button onClick={loadItems}>refresh</button>
    </>
  )
}
