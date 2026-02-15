import ModeToggle from '@frontend/components/theme/theme-toggle'
import { createFileRoute, Link } from '@tanstack/react-router'

import UserButton from '../user-button'

const Index: React.FC = () => {
  return (
    <>
      <h2>Cloudflare Workers with static assets</h2>
      <ModeToggle />
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
