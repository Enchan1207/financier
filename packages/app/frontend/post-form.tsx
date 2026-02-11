import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'

import { client } from './client'

// FIXME: copilotに作らせている。再レンダリングがちょっとひどい
export const PostForm: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = await getAccessTokenSilently()

    await client.posts.$post(
      {
        json: {
          title,
          content,
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    setTitle('')
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          タイトル:
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
            required
          />
        </label>
      </div>
      <div>
        <label>
          内容:
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
            }}
            required
          />
        </label>
      </div>
      <button type="submit">送信</button>
    </form>
  )
}
