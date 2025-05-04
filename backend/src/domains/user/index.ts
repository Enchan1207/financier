export type UserData = {
  name: string
  auth0UserId: string
  email: string
}

export type User = UserData & { id: string }
