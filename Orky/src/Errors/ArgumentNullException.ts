// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import ArgumentException from "./ArgumentException";

export class ArgumentNullException extends ArgumentException {
  constructor(argument: string) {
    super(argument, null, "Argument is null.");
  }
}
export default ArgumentNullException;
