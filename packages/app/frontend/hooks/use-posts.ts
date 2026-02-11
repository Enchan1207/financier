import { useAuth0 } from '@auth0/auth0-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { InferResponseType } from 'hono'

import { client } from '../client'

type PostListResponse = InferResponseType<typeof client.posts.$get, 200>
type PostItem = PostListResponse['items'][number]
type PostDetailResponse = InferResponseType<
  (typeof client.posts)[':id']['$get'],
  200
>

/**
 * 投稿一覧を取得するクエリフック
 */
export const usePostsQuery = () => {
  const { getAccessTokenSilently } = useAuth0()

  return useQuery<PostListResponse>({
    queryKey: ['posts'],
    queryFn: async () => {
      const token = await getAccessTokenSilently()

      const response = await client.posts.$get(undefined, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`投稿一覧の取得に失敗しました: ${response.status}`)
      }

      return response.json()
    },
  })
}

/**
 * 個別投稿を取得するクエリフック
 */
export const usePostQuery = (id: string) => {
  const { getAccessTokenSilently } = useAuth0()

  return useQuery<PostDetailResponse>({
    queryKey: ['posts', id],
    queryFn: async () => {
      const token = await getAccessTokenSilently()

      const response = await client.posts[':id'].$get(
        { param: { id } },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (response.status === 404) {
        throw new Error('投稿が見つかりません')
      }

      if (!response.ok) {
        throw new Error(`投稿の取得に失敗しました: ${response.status}`)
      }

      return response.json()
    },
  })
}

/**
 * 投稿を作成するミューテーションフック
 */
export const useCreatePostMutation = () => {
  const { getAccessTokenSilently } = useAuth0()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const token = await getAccessTokenSilently()

      const response = await client.posts.$post(
        {
          json: data,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      return response.json()
    },
    onSuccess: () => {
      // 投稿作成成功時に一覧のキャッシュを無効化して再フェッチ
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type { PostItem, PostListResponse, PostDetailResponse }
