export class ValidationError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// TODO: ここからレスポンス型を作るメソッドを提供しても良いかも
export class EntityNotFoundError extends Error {
  constructor(props: { id: string }) {
    super(`与えられたid ${props.id} に合致するエンティティは存在しない`)
    this.name = 'EntityNotFoundError'
    this.cause = { id: props.id }
  }
}
