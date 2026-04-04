export class CategoryNotFoundException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'CategoryNotFoundException'
  }
}

export class CategoryValidationException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'CategoryValidationException'
  }
}

export class CategoryRelationException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'CategoryRelationException'
  }
}
