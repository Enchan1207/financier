import { usePostQuery } from '@frontend/hooks/use-posts'
import { createFileRoute, Link } from '@tanstack/react-router'

const PostDetail: React.FC = () => {
  const { postId } = Route.useParams()
  const { data, isLoading, error } = usePostQuery(postId)

  if (isLoading) {
    return <p>読み込み中...</p>
  }

  if (error) {
    return (
      <>
        <p>エラーが発生しました: {error.message}</p>
        <Link to="/">ホームに戻る</Link>
      </>
    )
  }

  return (
    <>
      <h2>{data?.title}</h2>
      <p>{data?.content}</p>
      <Link to="/">ホームに戻る</Link>
    </>
  )
}

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetail,
})
