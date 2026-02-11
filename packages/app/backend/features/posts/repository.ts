import { and, eq } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

import type { Post, PostId } from '../../domains/post'
import type { UserId } from '../../domains/user'
import { postsTable } from '../../schemas/posts'

export const findPostsByUserId =
  (db: DrizzleD1Database) =>
  async (userId: UserId): Promise<Post[]> => {
    const records = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.user_id, userId))

    return records.map((record) => ({
      id: record.id as PostId,
      userId: record.user_id as UserId,
      title: record.title,
      content: record.content,
    }))
  }

export const findPostById =
  (db: DrizzleD1Database) =>
  async (postId: PostId, userId: UserId): Promise<Post | undefined> => {
    const records = await db
      .select()
      .from(postsTable)
      .where(and(eq(postsTable.id, postId), eq(postsTable.user_id, userId)))

    const record = records.at(0)
    if (record === undefined) {
      return undefined
    }

    return {
      id: record.id as PostId,
      userId: record.user_id as UserId,
      title: record.title,
      content: record.content,
    }
  }

export const savePost =
  (db: DrizzleD1Database) =>
  async (post: Post): Promise<Post> => {
    const inserted = await db
      .insert(postsTable)
      .values({
        id: post.id,
        user_id: post.userId,
        title: post.title,
        content: post.content,
      })
      .returning()

    const record = inserted[0]
    return {
      id: record.id as PostId,
      userId: record.user_id as UserId,
      title: record.title,
      content: record.content,
    }
  }
