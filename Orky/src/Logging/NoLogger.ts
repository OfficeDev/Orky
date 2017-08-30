import { ILogger } from "./Interfaces";

export class NoLogger implements ILogger {
  info(message: string | Error): void {
    return;
  }
  warn(message: string | Error): void {
    return;
  }
  debug(message: string | Error): void {
    return;
  }
  error(message: string | Error): void {
    return;
  }
  logMessage(severity: string | number, message: string): void {
    return;
  }
  logException(error: Error): void {
    return;
  }
}
export default NoLogger;
