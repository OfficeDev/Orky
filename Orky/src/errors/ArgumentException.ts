export class ArgumentException extends Error {
  constructor(argument: string, error: string) {
    const message = `Argument '${argument}' has an unexpected value. ${error}`;
    super(message);
  }
}
