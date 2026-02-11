import type { Post, PostId } from '../../domains/post'
import type { UserId } from '../../domains/user'

/** 投稿作成コマンド */
export type CreatePostCommand = {
  readonly input: {
    readonly userId: UserId
    readonly title: string
    readonly content: string
  }
}

/** 投稿作成完了イベント */
export type PostCreatedEvent = {
  readonly created: Post
}

type SavePostFn = (post: Post) => Promise<Post>

export const buildCreatePostWorkflow =
  (savePost: SavePostFn) =>
  async (command: CreatePostCommand): Promise<PostCreatedEvent> => {
    const newPost: Post = {
      id: crypto.randomUUID() as PostId,
      userId: command.input.userId,
      title: command.input.title,
      content: command.input.content,
    }

    const created = await savePost(newPost)
    return { created }
  }
