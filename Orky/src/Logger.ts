export interface ILogger {
  info(message: string): void
  warn(message: string): void
  debug(message: string): void
  error(message: string): void
}

export class NoLogger {
  info(message: string): void { return; }
  warn(message: string): void { return; }
  debug(message: string): void { return; }
  error(message: string): void { return; }
}

/* tslint:disable:no-console */
export class ConsoleLogger implements ILogger {
  public static Debug = 0;
  public static Info = 1;
  public static Warning = 2;
  public static Error = 3;
  public static None = 4;

  private _logLevel: number;

  constructor(logLevel: number) {
    this._logLevel = logLevel || ConsoleLogger.Info;
  }

  info(message: string): void {
    if(this._logLevel <= ConsoleLogger.Info) {
      console.log(`${Date.now()} [Info] ${message}`);
    }
  }
  warn(message: string): void {
    if(this._logLevel <= ConsoleLogger.Warning) {
      console.log(`${Date.now()} [Warn] ${message}`);
    }
  }
  debug(message: string): void {
    if(this._logLevel <= ConsoleLogger.Debug) {
      console.log(`${Date.now()} [Debug] ${message}`);
    }
  }
  error(message: string): void {
    if(this._logLevel <= ConsoleLogger.Error) {
      console.log(`${Date.now()} [Error] ${message}`);
    }
  }
}
/* tslint:enable:no-console */
