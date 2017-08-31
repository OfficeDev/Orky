// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
export class InvalidOperationException extends Error {
  constructor(message: string) {
    super(message);
  }
}
export default InvalidOperationException;
