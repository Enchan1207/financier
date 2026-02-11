import { createFileRoute,Link } from '@tanstack/react-router'

import { usePostsQuery } from '../hooks/use-posts'
import { PostForm } from '../post-form'

const PostsIndex: React.FC = () => {
  const { data, isLoading, error, refetch } = usePostsQuery()

  if (isLoading) {
    return <p>読み込み中...</p>
  }

  if (error) {
    return <p>エラーが発生しました: {error.message}</p>
  }

  return (
    <>
      <h2>投稿一覧</h2>
      <ul>
        {data?.items.map((item) => (
          <li key={item.id}>
            <Link to="/posts/$id" params={{ id: item.id }}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <button onClick={() => refetch()}>refresh</button>

      <h3>新規投稿</h3>
      <PostForm />
    </>
  )
}

export const Route = createFileRoute('/posts/')({
  component: PostsIndex,
})
