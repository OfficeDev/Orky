import {ArgumentOutOfRangeException} from "../Errors";
import {ILogger} from "./Interfaces";

export abstract class BaseLogger implements ILogger {
  static DEBUG = 0;
  static INFO = 1;
  static WARNING = 2;
  static ERROR = 3;
  static NONE = 4;

  private _logLevel: number;

  constructor(logLevel?: number | string) {
    if (!logLevel) {
      this._logLevel = BaseLogger.INFO;
    }
    else if(typeof logLevel === 'string') {
      this._logLevel = this.parseLogLevelString(logLevel);
    }
    else {
      this._logLevel = logLevel;
    }
  }

  info(message: string|Error): void {
    if(this._logLevel <= BaseLogger.INFO) {
      this.logMessage("Info", message);
    }
  }
  warn(message: string|Error): void {
    if(this._logLevel <= BaseLogger.WARNING) {
      this.logMessage("Warn", message);
    }
  }
  debug(message: string|Error): void {
    if(this._logLevel <= BaseLogger.DEBUG) {
      this.logMessage("Debug", message);
    }
  }
  error(message: string|Error): void {
    if(this._logLevel <= BaseLogger.ERROR) {
      this.logMessage("Error", message);
    }
  }

  protected abstract logMessage(severity: string, message: string|Error): void;

  private parseLogLevelString(logLevel: string): number {
    switch(logLevel.toLowerCase()) {
      case 'debug':
        return BaseLogger.DEBUG;
      case 'info':
        return BaseLogger.INFO;
      case 'warning':
        return BaseLogger.WARNING;
      case 'error':
        return BaseLogger.ERROR;
      case 'none':
        return BaseLogger.NONE;
      default:
        throw new ArgumentOutOfRangeException("logLevel", logLevel, ["debug", "info", "warning", "error", "none"]);
    }
  }
}
export default BaseLogger;
