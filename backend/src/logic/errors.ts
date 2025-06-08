import type { User } from '@/domains/user'

export class ValidationError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class EntityNotFoundError extends Error {
  constructor(props: { id: string }) {
    super(`与えられたid ${props.id} に合致するエンティティは存在しない`)
    this.name = 'EntityNotFoundError'
    this.cause = { id: props.id }
  }
}

export class EntityAuthorizationError extends Error {
  constructor(props: { id: string; userId: User['id'] }) {
    super(
      `ユーザ ${props.userId} はエンティティ ${props.id} に対するアクセス権を持たない`,
    )
    this.name = 'EntityAuthorizationError'
    this.cause = {
      id: props.id,
      userId: props.userId,
    }
  }
}
