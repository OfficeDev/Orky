// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as Path from "path";
import {Server} from "http";
import * as Express from "express";
import * as SocketIO from "socket.io";
import {UniversalBot, ChatConnector, IMiddlewareMap, IEvent, Session} from "botbuilder";
import { ConsoleLogger, ILogger, ApplicationInsightsLogger, CompoundLogger, NoLogger } from "./Logging";
import {Config, IConfig, StorageType} from "./Config";
import {BotRepository, IDataStorage, FileStorage, MemoryStorage} from "./Repositories";
import {BotConnectionManager, BotService, BotMessageFormatter} from "./Services"
import {Dialogs} from "./Dialogs";
import {ArgumentNullException} from "./Errors";

export class Orky {
  private _config: IConfig;
  private _logger: ILogger;
  private _server: Server | null = null;

  constructor(config: IConfig, logger: ILogger) {
    if (!config) {
      throw new ArgumentNullException("config");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }

    this._config = config;
    this._logger = logger;

    this._logger.info('Created new instance of Orky.');
    this._logger.debug(`Config: ${JSON.stringify(this._config)}`);
  }

  run(): void {   
    const chatConnector = new ChatConnector({
      appId: this._config.MicrosoftAppId,
      appPassword: this._config.MicrosoftAppPassword
    });

    let botStorage: IDataStorage;
    if (this._config.BotDataStorageType === StorageType.File) {
      botStorage = new FileStorage(this._logger, this._config.BotDataFilePath);
    }
    else {
      botStorage = new MemoryStorage(this._logger);
    }

    const botRepository = new BotRepository(botStorage, this._logger);
    const botConnectionManager = new BotConnectionManager(botRepository, this._config.BotResponseTimeout, this._logger);
    const botService = new BotService(botRepository, botConnectionManager, this._logger, this._config.BotKeepDuration);
    const botMessageFormatter = new BotMessageFormatter();
    const universalBot = Dialogs.register(chatConnector, botService, botMessageFormatter, this._logger, this._config);

    const app = Express();
    this._server = app.listen(this._config.ServerPort, () => {
      let address = {address: "unknown"};
      if (this._server) {
        address = this._server.address();
      }
      this._logger.info(`Orky is running on ${JSON.stringify(address)}`); 
    });

    app.use(Express.static(Path.join(__dirname, "../public")));
    app.post(this._config.MessagesEndpoint, chatConnector.listen());

    const io = SocketIO(this._server, {
      path: this._config.BotConnectionEndpoint
    });

    io.use((socket, next) => {
      botService.authorizeConnection(socket)
        .then(() => next())
        .catch((error) => {
          this._logger.logException(error);
          next(error)
        });
    });

    io.on('connection', (socket) => {
      botService.establishConnection(socket)
        .catch((error) => {
          this._logger.logException(error);
        });
    });
  }

  stop(): void {
    if (this._server && this._server.listening) {
      this._server.close(() => {
        this._logger.info("Orky shut down");
      });
    }
  }
}

export function run(): void {
  const config = new Config();
  
  const loggers = [];
  loggers.push(new ConsoleLogger(config.LogLevel));

  if (config.ApplicationInsightsKey) {
    loggers.push(new ApplicationInsightsLogger(config.LogLevel, config.ApplicationInsightsKey));
  }

  let logger: ILogger;
  if (loggers.length === 1) {
    logger = loggers[0];
  }
  else if (loggers.length > 1) {
    logger = new CompoundLogger(config.LogLevel, loggers);
  }
  else {
    logger = new NoLogger();
  }
  const orky = new Orky(config, logger);  

  process.on("uncaughtException", (error) => {
    logger.logException(error);
  });

  process.on("unhandledRejection", (error) => {
    if (!(error instanceof Error)) {
      error = new Error(error);
    }
    logger.logException(error);
  });

  process.on("warning", (warning) => {
    logger.warn(`${warning.name}: ${warning.message} ${warning.stack}`);
  });

  process.on('SIGINT', () => {
    orky.stop();
  });

  process.on("exit", (code) => {
    orky.stop();
  });
  orky.run();
}
