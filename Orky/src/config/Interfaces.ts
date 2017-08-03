export interface IConfig {
  readonly Name: string;
  readonly Version: string;
  readonly MicrosoftAppId: string;
  readonly MicrosoftAppPassword: string;
  readonly ServerPort: string;
  readonly MessagesEndpoint: string;
  readonly DefaultLocale: string;
  readonly LocalePath: string;
  readonly BotDataFilePath: string;
  readonly LogLevel: number | string;
  readonly BotResponseTimeout: number;
}
