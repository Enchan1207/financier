import { PostForm } from './post-form'
import { PostList } from './post-list'
import UserButton from './user-button'

const App: React.FC = () => {
  return (
    <>
      <h2>Cloudflare Workers with static assets</h2>
      <UserButton />
      <PostList />
      <PostForm />
    </>
  )
}

export default App
