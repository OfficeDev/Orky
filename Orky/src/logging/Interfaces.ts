export interface ILogger {
  info(message: string|Error): void
  warn(message: string|Error): void
  debug(message: string|Error): void
  error(message: string|Error): void
}
