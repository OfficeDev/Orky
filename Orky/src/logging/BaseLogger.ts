import {ILogger} from "./Interfaces";

export class BaseLogger implements ILogger {
  public static Debug = 0;
  public static Info = 1;
  public static Warning = 2;
  public static Error = 3;
  public static None = 4;

  private _logLevel: number;

  constructor(logLevel?: number | string) {
    if (!logLevel) {
      logLevel = BaseLogger.Info;
    }

    if(typeof logLevel === 'string') {
      switch(logLevel.toLowerCase()) {
        case 'debug':
          logLevel = BaseLogger.Debug;
          break;
        case 'warning':
          logLevel = BaseLogger.Warning;
          break;
        case 'error':
          logLevel = BaseLogger.Error;
          break;
        case 'info':
        default:
          logLevel = BaseLogger.Info;
      }
    }
    this._logLevel = logLevel;
  }

  info(message: string): void {
    if(this._logLevel <= BaseLogger.Info) {
      this.logMessage("Info", message);
    }
  }
  warn(message: string): void {
    if(this._logLevel <= BaseLogger.Warning) {
      this.logMessage("Warn", message);
    }
  }
  debug(message: string): void {
    if(this._logLevel <= BaseLogger.Debug) {
      this.logMessage("Debug", message);
    }
  }
  error(message: string): void {
    if(this._logLevel <= BaseLogger.Error) {
      this.logMessage("Error", message);
    }
  }

  protected logMessage(severity: string, message: string): void {}
}
