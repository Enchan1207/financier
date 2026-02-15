import { useEffect, useMemo, useState } from 'react'

type PostItem = {
  id: string
  title: string
  content: string
}

type PostListResponse = {
  items: PostItem[]
}

type PostDetailResponse = PostItem

const postListeners = new Set<() => void>()

let postsStore: PostItem[] = [
  {
    id: 'post-1',
    title: 'posts モックガイド',
    content: 'この機能は実装方針のガイド用です。',
  },
]

const subscribePosts = (listener: () => void): (() => void) => {
  postListeners.add(listener)

  return () => {
    postListeners.delete(listener)
  }
}

const notifyPostsChanged = () => {
  postListeners.forEach((listener) => {
    listener()
  })
}

const usePostsSnapshot = (): PostItem[] => {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribePosts(() => {
      setVersion((current) => current + 1)
    })
  }, [])

  return useMemo(() => {
    void version
    return postsStore
  }, [version])
}

export const usePostsQuery = () => {
  const items = usePostsSnapshot()

  return {
    data: {
      items,
    } satisfies PostListResponse,
    isLoading: false,
    error: null,
    refetch: () => {
      notifyPostsChanged()
      return Promise.resolve()
    },
  }
}

export const usePostQuery = (id: string) => {
  const items = usePostsSnapshot()

  const data = useMemo(() => {
    return items.find((item) => item.id === id)
  }, [id, items])

  return {
    data: data,
    isLoading: false,
    error: data === undefined ? new Error('投稿が見つかりません') : null,
  }
}

export const useCreatePostMutation = () => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  return {
    isPending,
    isError: error !== null,
    error,
    mutateAsync: (data: { title: string; content: string }) => {
      setIsPending(true)
      setError(null)

      try {
        if (
          data.title.trim().length === 0 ||
          data.content.trim().length === 0
        ) {
          throw new Error('タイトルと内容を入力してください')
        }

        const newPost: PostItem = {
          id: `post-${Date.now()}`,
          title: data.title,
          content: data.content,
        }

        postsStore = [newPost, ...postsStore]
        notifyPostsChanged()

        return Promise.resolve(newPost)
      } catch (cause) {
        const normalizedError =
          cause instanceof Error ? cause : new Error('投稿の作成に失敗しました')

        setError(normalizedError)
        return Promise.reject(normalizedError)
      } finally {
        setIsPending(false)
      }
    },
  }
}

export type { PostDetailResponse, PostItem, PostListResponse }
