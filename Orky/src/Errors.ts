export class ArgumentException extends Error {
  constructor(argument: string, error: string) {
    const message = `Argument '${argument}' has an unexpected value. ${error}`;
    super(message);
  }
}

export class ArgumentNullException extends ArgumentException {
  constructor(argument: string) {
    super(argument, "Argument is undefined.");
  }
}

export class InvalidOperationException extends Error {
  constructor(message: string) {
    super(message);
  }
}
