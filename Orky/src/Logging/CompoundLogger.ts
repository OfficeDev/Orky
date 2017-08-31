// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import BaseLogger from "./BaseLogger";
import { ILogger } from "./Interfaces";
import { ArgumentNullException } from "../Errors";

export class CompoundLogger extends BaseLogger {
  private _loggers: ILogger[];
  
  constructor(logLevel: number | string, loggers: ILogger[]) {
    super(logLevel);
    if (!loggers) {
      throw new ArgumentNullException("loggers");
    }

    this._loggers = loggers;
  }

  logMessage(severity: string|number, message: string): void {
    this._loggers.forEach((logger) => {
      logger.logMessage(severity, message);
    });
  }

  logException(error: Error): void {
    this._loggers.forEach((logger) => {
      logger.logException(error);
    })
  }
}

export default CompoundLogger;
