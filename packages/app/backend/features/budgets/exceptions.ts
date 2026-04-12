export class FiscalYearNotFoundException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'FiscalYearNotFoundException'
  }
}

export class FiscalYearClosedException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'FiscalYearClosedException'
  }
}

export class BudgetValidationException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'BudgetValidationException'
  }
}

export class BudgetNotFoundException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'BudgetNotFoundException'
  }
}
