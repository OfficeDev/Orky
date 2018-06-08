// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
export interface ILogger {
  info(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
  error(message: string): void;
  logMessage(severity: string|number, message: string): void;
  logException(error: Error): void;
}
