export enum StorageType {
  Memory = 0,
  File = 1
}

export interface IConfig {
  readonly Name: string;
  readonly Version: string;
  readonly MicrosoftAppId: string;
  readonly MicrosoftAppPassword: string;
  readonly MicrosoftTenantFilter: string[];
  readonly ServerPort: string;
  readonly MessagesEndpoint: string;
  readonly DefaultLocale: string;
  readonly LocalePath: string;
  readonly BotDataStorageType: StorageType;
  readonly BotKeepDuration: number;
  readonly BotDataFilePath: string;
  readonly LogLevel: number | string;
  readonly BotResponseTimeout: number;
}
