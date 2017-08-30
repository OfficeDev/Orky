import { ArgumentOutOfRangeException } from "../Errors";

export const LogSeverity = {
  Debug: 0,
  Info: 1,
  Warn: 2,
  Error: 3,

  fromString(logLevel: string): number {
    switch(logLevel.toLowerCase()) {
      case 'debug':
        return LogSeverity.Debug;
      case 'info':
        return LogSeverity.Info;
      case 'warning':
        return LogSeverity.Warn;
      case 'error':
        return LogSeverity.Error;
      default:
        throw new ArgumentOutOfRangeException("logLevel", logLevel, ["debug", "info", "warning", "error"]);
    }
  },

  toString(logLevel: number): string {
    switch(logLevel) {
      case LogSeverity.Debug:
        return "debug";
      case LogSeverity.Info:
        return "info";
      case LogSeverity.Warn:
        return "warn";
      case LogSeverity.Error:
        return "error";
      default:
        throw new ArgumentOutOfRangeException("logLevel", logLevel, [0, 1, 2, 3]);
    }
  }
};
export default LogSeverity;
