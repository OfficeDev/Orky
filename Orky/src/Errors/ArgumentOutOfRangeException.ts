// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import ArgumentException from "./ArgumentException";

export class ArgumentOutOfRangeException extends ArgumentException {
  constructor(argument: string, value: string|number, range: string[]|number[]|number, rangeEnd?: number) {
    const rangeEndStr = rangeEnd ? rangeEnd : "infinite";
    let rangeStr = `${range} - ${rangeEndStr}`
    if (Array.isArray(range)) {
      rangeStr = range.join(", ");
    }

    const error = `Acceptable range is [${rangeStr}].`;
    super(argument, value, error);
  }
}
export default ArgumentOutOfRangeException;
