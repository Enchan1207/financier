import type { Result } from 'neverthrow'
import { ResultAsync } from 'neverthrow'

export const fromSafePromise = <T, U, V>(fn: (arg: T) => Promise<Result<U, V>>):
((arg: T) => ResultAsync<U, V>) => (arg: T) => new ResultAsync(fn(arg))
