import {ArgumentException} from "./ArgumentException";

export class ArgumentNullException extends ArgumentException {
  constructor(argument: string) {
    super(argument, "Argument is undefined.");
  }
}
