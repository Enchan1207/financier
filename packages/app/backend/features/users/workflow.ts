import type { User, UserId } from '../../domains/user'

type LoginCommand = {
  idpSubject: string
}

type LoggedInEvent =
  | { type: 'existing'; user: User }
  | { type: 'provisioned'; user: User }

type FindUserByIdPSubject = (idpSubject: string) => Promise<User | undefined>
type SaveUser = (user: User) => Promise<User>

/**
 * ログインワークフロー
 * 既存ユーザの場合は取得し、新規の場合はプロビジョニングする
 */
export const buildLoginWorkflow =
  (findUserByIdPSubject: FindUserByIdPSubject, saveUser: SaveUser) =>
  async (command: LoginCommand): Promise<LoggedInEvent> => {
    const existingUser = await findUserByIdPSubject(command.idpSubject)

    if (existingUser !== undefined) {
      return { type: 'existing', user: existingUser }
    }

    const newUser: User = {
      id: crypto.randomUUID() as UserId,
      idpSubject: command.idpSubject,
    }

    const savedUser = await saveUser(newUser)

    return { type: 'provisioned', user: savedUser }
  }
