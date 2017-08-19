export class ArgumentException extends Error {
  constructor(argument: string, value: any, error: string) {
    const message = `Argument '${argument}' has an unexpected value '${value}'. ${error}`;
    super(message);
  }
}
export default ArgumentException;
