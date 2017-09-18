import { expect } from 'chai';
import 'mocha';
import { InvalidOperationException } from '../../src/Errors';
import { StorageType, Config } from '../../src/Config';

describe('Config', () => {
  beforeEach(() => {
    delete process.env.NAME;
    delete process.env.VERSION;
    delete process.env.MICROSOFT_APP_ID;
    delete process.env.MICROSOFT_APP_PASSWORD;
    delete process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    delete process.env.MICROSOFT_TENANT_FILTER;
    delete process.env.PORT;
    delete process.env.MESSAGES_ENDPOINT;
    delete process.env.BOT_CONNECTION_ENDPOINT;
    delete process.env.DEFAULT_LOCALE;
    delete process.env.LOCALE_PATH;
    delete process.env.BOT_KEEP_DURATION;
    delete process.env.BOT_DATA_STORAGE_TYPE;
    delete process.env.BOT_DATA_FILE_PATH;
    delete process.env.LOG_LEVEL;
    delete process.env.BOT_RESPONSE_TIMEOUT;
  });

  it('should fail when MICROSOFT_APP_ID is not set.', () => {
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    expect(() => new Config()).to.throw(InvalidOperationException);
  });

  it('should fail when MICROSOFT_APP_PASSWORD is not set.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    expect(() => new Config()).to.throw(InvalidOperationException);
  });

  it('should succeed when MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD are set.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    const config = new Config();

    expect(config.MicrosoftAppId).to.equal(process.env.MICROSOFT_APP_ID);
    expect(config.MicrosoftAppPassword).to.equal(process.env.MICROSOFT_APP_PASSWORD);
  });

  it('should have default values when not overidden.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    const config = new Config();

    const expected = {
      Name: 'orky',
      Version: '0.2.1',
      ApplicationInsightsKey: undefined,
      MicrosoftAppId: 'APP_ID',
      MicrosoftAppPassword: 'APP_PASSWORD',
      MicrosoftTenantFilter: [],
      ServerPort: '3978',
      MessagesEndpoint: '/api/messages',
      BotConnectionEndpoint: '/socket.io',
      DefaultLocale: 'en',
      LocalePath: './locale',
      BotKeepDuration: 0,
      BotDataStorageType: 0,
      BotDataFilePath: './BotData.json',
      LogLevel: 'info',
      BotResponseTimeout: 10000
    };

    expect(config).to.deep.equal(expected);
  });
  
  it('should set Name properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.NAME = "NAME";
    const config = new Config();

    expect(config.Name).to.equal(process.env.NAME);
  });

  it('should set Version properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.VERSION = "VERSION";
    const config = new Config();

    expect(config.Version).to.equal(process.env.VERSION);
  });

  it('should set ApplicationInsightsKey properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.APPINSIGHTS_INSTRUMENTATIONKEY = "APP_INSIGHTS_KEY";
    const config = new Config();

    expect(config.ApplicationInsightsKey).to.equal(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
  });

  it('should set MicrosoftTenantFilter properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.MICROSOFT_TENANT_FILTER = "123,124";
    const config = new Config();

    expect(config.MicrosoftTenantFilter).to.deep.equal(["123","124"]);
  });

  it('should set ServerPort properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.PORT = "1234";
    const config = new Config();

    expect(config.ServerPort).to.equal(process.env.PORT);
  });

  it('should set MessagesEndpoint properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.MESSAGES_ENDPOINT = "api/1234";
    const config = new Config();

    expect(config.MessagesEndpoint).to.equal(process.env.MESSAGES_ENDPOINT);
  });

  it('should set BotConnectionEndpoint properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.BOT_CONNECTION_ENDPOINT = "api/1234";
    const config = new Config();

    expect(config.BotConnectionEndpoint).to.equal(process.env.BOT_CONNECTION_ENDPOINT);
  });

  it('should set DefaultLocale properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.DEFAULT_LOCALE = "hello";
    const config = new Config();

    expect(config.DefaultLocale).to.equal(process.env.DEFAULT_LOCALE);
  });

  it('should set LocalePath properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.LOCALE_PATH = "hello";
    const config = new Config();

    expect(config.LocalePath).to.equal(process.env.LOCALE_PATH);
  });

  it('should set BotKeepDuration properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.BOT_KEEP_DURATION = "1234";
    const config = new Config();

    expect(config.BotKeepDuration).to.equal(parseInt(process.env.BOT_KEEP_DURATION as string));
  });

  it('should set BotDataStorageType properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.BOT_DATA_STORAGE_TYPE = "file";
    const config = new Config();

    expect(config.BotDataStorageType).to.equal(StorageType.File);
  });

  it('should set BotDataFilePath properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.BOT_DATA_FILE_PATH = "filePath";
    const config = new Config();

    expect(config.BotDataFilePath).to.equal(process.env.BOT_DATA_FILE_PATH);
  });

  it('should set LogLevel properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.LOG_LEVEL = "debug";
    const config = new Config();

    expect(config.LogLevel).to.equal(process.env.LOG_LEVEL);
  });

  it('should set BotResponseTimeout properly.', () => {
    process.env.MICROSOFT_APP_ID = "APP_ID";
    process.env.MICROSOFT_APP_PASSWORD = "APP_PASSWORD";
    process.env.BOT_RESPONSE_TIMEOUT = "1234";
    const config = new Config();

    expect(config.BotResponseTimeout).to.equal(parseInt(process.env.BOT_RESPONSE_TIMEOUT as string));
  });
});
