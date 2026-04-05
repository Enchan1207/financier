export class EventTemplateNotFoundException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'EventTemplateNotFoundException'
  }
}

export class EventTemplateValidationException extends Error {
  constructor(...args: ConstructorParameters<ErrorConstructor>) {
    super(...args)
    this.name = 'EventTemplateValidationException'
  }
}
