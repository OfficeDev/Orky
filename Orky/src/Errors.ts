export class ArgumentNullException extends Error {
  constructor(argument: string) {
    const message = `Argument '${argument}' is undefined.`;
    super(message);
  }
}

export class InvalidOperationException extends Error {
  constructor(message: string) {
    super(message);
  }
}
