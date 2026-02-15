import { useState } from 'react'

import { useCreatePostMutation } from './hooks/use-posts'

export const PostForm: React.FC = () => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const createPostMutation = useCreatePostMutation()

  const handleSubmit = async () => {
    await createPostMutation.mutateAsync({
      title,
      content,
    })

    setTitle('')
    setContent('')
  }

  return (
    <form>
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
      <button
        type="submit"
        disabled={createPostMutation.isPending}
        onClick={handleSubmit}
      >
        {createPostMutation.isPending ? '送信中...' : '送信'}
      </button>
      {createPostMutation.isError && (
        <p>エラーが発生しました: {createPostMutation.error?.message}</p>
      )}
    </form>
  )
}
