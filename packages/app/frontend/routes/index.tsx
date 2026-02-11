import { Link, createFileRoute } from '@tanstack/react-router'
import UserButton from '../user-button'

const Index: React.FC = () => {
  return (
    <>
      <h2>Cloudflare Workers with static assets</h2>
      <UserButton />
      <nav>
        <Link to="/posts">投稿一覧へ</Link>
      </nav>
    </>
  )
}

export const Route = createFileRoute('/')({
  component: Index,
})
