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

export type CategoryReferences = {
  transactions: boolean
  budgets: boolean
  savingDefinitions: boolean
}

export class CategoryHasReferencesException extends Error {
  constructor(
    public readonly references: CategoryReferences,
    message: string,
  ) {
    super(message)
    this.name = 'CategoryHasReferencesException'
  }
}
