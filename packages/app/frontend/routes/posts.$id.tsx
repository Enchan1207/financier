import { createFileRoute,Link } from '@tanstack/react-router'

import { usePostQuery } from '../hooks/use-posts'

const PostDetail: React.FC = () => {
  const { id } = Route.useParams()
  const { data, isLoading, error } = usePostQuery(id)

  if (isLoading) {
    return <p>読み込み中...</p>
  }

  if (error) {
    return (
      <>
        <p>エラーが発生しました: {error.message}</p>
        <Link to="/posts">一覧に戻る</Link>
      </>
    )
  }

  return (
    <>
      <h2>{data?.title}</h2>
      <p>{data?.content}</p>
      <Link to="/posts">一覧に戻る</Link>
    </>
  )
}

export const Route = createFileRoute('/posts/$id')({
  component: PostDetail,
})
