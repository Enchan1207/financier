export class CategoryNotFoundException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'CategoryNotFoundException'
  }
}

export class CategoryConflictException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'CategoryConflictException'
  }
}

export class CategoryValidationException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'CategoryValidationException'
  }
}
