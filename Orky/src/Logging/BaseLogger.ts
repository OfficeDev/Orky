// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {ArgumentOutOfRangeException} from "../Errors";
import {ILogger} from "./Interfaces";
import { LogSeverity } from "./LogSeverity";

export abstract class BaseLogger implements ILogger {
  private _logLevel: number;

  constructor(logLevel: number|string) {
    if (!logLevel) {
      this._logLevel = LogSeverity.Info;
    }
    else if(typeof logLevel === 'string') {
      this._logLevel = LogSeverity.fromString(logLevel);
    }
    else {
      this._logLevel = logLevel;
    }
  }

  info(message: string): void {
    this.filterAndLogMessage(LogSeverity.Info, message);
  }
  warn(message: string): void {
    this.filterAndLogMessage(LogSeverity.Warn, message);
  }
  debug(message: string): void {
    this.filterAndLogMessage(LogSeverity.Debug, message);
  }
  error(message: string): void {
    this.filterAndLogMessage(LogSeverity.Error, message);
  }

  private filterAndLogMessage(severity: number, message: string): void {
    if(this._logLevel <= severity) {
      this.logMessage(severity, message);
    }
  }

  abstract logMessage(severity: number|string, message: string): void;
  abstract logException(error: Error): void;
}
export default BaseLogger;
