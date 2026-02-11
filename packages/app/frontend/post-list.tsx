import { useState } from 'react'

import { usePostQuery, usePostsQuery } from './hooks/use-posts'

export const PostList: React.FC = () => {
  const { data, isLoading, error, refetch } = usePostsQuery()
  const [selectedPostId, setSelectedPostId] = useState<string>('')
  const { data: selectedPost } = usePostQuery(selectedPostId, {
    enabled: !!selectedPostId,
  })

  const lookupItem = (id: string) => {
    setSelectedPostId(id)
  }

  // 選択された投稿の詳細を表示
  if (selectedPost) {
    alert(selectedPost.content)
    setSelectedPostId('')
  }

  if (isLoading) {
    return <p>読み込み中...</p>
  }

  if (error) {
    return <p>エラーが発生しました: {error.message}</p>
  }

  return (
    <>
      <ul>
        {data?.items.map((item) => (
          <li key={item.id}>
            {item.title}
            <button onClick={() => lookupItem(item.id)}>lookup</button>
          </li>
        ))}
      </ul>
      <button onClick={() => refetch()}>refresh</button>
    </>
  )
}
