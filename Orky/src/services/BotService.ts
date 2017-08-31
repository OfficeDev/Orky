// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as crypto from 'crypto';
import * as SocketIO from "socket.io";
import {ArgumentNullException, ArgumentException} from "../Errors";
import {Bot, BotStatus, BotMessage, BotResponse} from "../Models";
import {ILogger} from "../Logging";
import {IBotRepository} from "../Repositories";
import {IBotConnectionManager, IBotResponseHandler, IBotService} from "./Interfaces";
import {BotNotFoundException, BotAlreadyExistsException, BotIsDisabledException, CopyKeyNotFoundException, BotNotConnectedException} from "../ServiceErrors";

export class BotService implements IBotService {
  private _botRepository: IBotRepository;
  private _botConnectionManager: IBotConnectionManager;
  private _logger: ILogger;
  private _botKeepDuration: number;
  private _botIdCopies: {[key:string]: string};

  constructor(
    botRepository: IBotRepository,
    botConnectionManager: IBotConnectionManager,
    logger: ILogger,
    botKeepDuration: number) {
    if (!botRepository) {
      throw new ArgumentNullException("botRepository");
    }
    if (!botConnectionManager) {
      throw new ArgumentNullException("botConnectionManager");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    this._botRepository = botRepository;
    this._botConnectionManager = botConnectionManager;
    this._logger = logger;
    this._botKeepDuration = botKeepDuration;
    this._botIdCopies = {};
  }

  authorizeConnection(socket: SocketIO.Socket): Promise<void> {
    return this._botConnectionManager.authorizeConnection(socket);
  }

  async establishConnection(socket: SocketIO.Socket): Promise<void> {
    const botId = await this._botConnectionManager.establishConnection(socket);
    const bot = await this._botRepository.findById(botId);
    await this._botConnectionManager.rename(bot.id, bot.name);
  }

  async registerBotWithName(teamId: string, botName: string): Promise<Bot> {
    if(await this._botRepository.exists(teamId, botName)) {
      throw new BotAlreadyExistsException(botName, teamId);
    }
    
    const secret = await this.createRandomKey(32);
    let bot = new Bot(teamId, botName, secret);
    bot = await this._botRepository.save(bot);

    if (this._botKeepDuration) {
      setTimeout(async (botId: string) => {
        await this._botRepository.deleteById(botId)
        await this._botConnectionManager.disconnect(botId);
      }, this._botKeepDuration, bot.id);
    }
    return bot;
  }

  async deregisterBotWithName(teamId: string, botName: string): Promise<Bot> {
    const bot = await this._botRepository.findByTeamAndName(teamId, botName);
    bot.removeFromTeam(teamId);
    if (bot.teamId.length === 0) {
      await this._botRepository.deleteById(bot.id);
      await this._botConnectionManager.disconnect(bot.id);
    }
    return bot;
  }

  async enableBotWithName(teamId: string, botName: string): Promise<Bot> {
    const bot = await this._botRepository.findByTeamAndName(teamId, botName);
    bot.disabled = false;
    return await this._botRepository.save(bot);
  }

  async disableBotWithName(teamId: string, botName: string): Promise<Bot> {
    const bot = await this._botRepository.findByTeamAndName(teamId, botName);
    bot.disabled = true;
    return await this._botRepository.save(bot);
  }

  async renameBot(teamId: string, fromName: string, toName: string): Promise<Bot> {
    let bot = await this._botRepository.findByTeamAndName(teamId, fromName);
    await Promise.all(bot.teamId.map(async (teamId) => {
      if(await this._botRepository.exists(teamId, toName)) {
        // Fail if there is another bot with the same toName.
        // If the toName is the same as the bot's name and only casing is different
        // then we should rename it still.
        if (fromName.toLowerCase() !== toName.toLowerCase()) {
          throw new BotAlreadyExistsException(toName, teamId);
        }
      }
    }));
    
    bot.name = toName;
    bot = await this._botRepository.save(bot);
    try {
      await this._botConnectionManager.rename(bot.id, bot.name);
    }
    catch(error) {
      // Ignore. Bot will get the rename when it reconnects.
      if (!(error instanceof BotNotConnectedException)) {
        throw error;
      }
    }
    return bot;
  }

  async getBotStatuses(teamId: string): Promise<BotStatus[]> {
    const bots = await this._botRepository.getAllByTeam(teamId);
    const statuses = await Promise.all(bots.map(async (bot) => {
      let status = BotStatus.DISCONNECTED;
      if (bot.disabled) {
        status = BotStatus.DISABLED;
      }
      else if (await this._botConnectionManager.isConnected(bot.id)) {
        status = BotStatus.CONNECTED;
      }
      return new BotStatus(bot, status);
    }));
    return statuses;
  }

  async sendMessageToBot(teamId: string, botName: string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<Bot> {
    const bot = await this._botRepository.findByTeamAndName(teamId, botName);
    if (bot.disabled) {
      throw new BotIsDisabledException(bot.id);
    }

    await this._botConnectionManager.sendMessage(bot.id, message, responseHandler);
    return bot;
  }

  async copyBot(teamId: string, botName: string) : Promise<string> {
    const bot = await this._botRepository.findByTeamAndName(teamId, botName)
    const copyKey = await this.createRandomKey(6);
    this._botIdCopies[copyKey] = bot.id;
    return copyKey;
  }

  async pasteBot(teamId: string, copyKey: string) : Promise<Bot> {
    const botId = this._botIdCopies[copyKey];
    delete this._botIdCopies[copyKey];

    if (!botId) {
      throw new CopyKeyNotFoundException(copyKey);
    }

    const bot = await this._botRepository.findById(botId);
    if(await this._botRepository.exists(teamId, bot.name)) {
      throw new BotAlreadyExistsException(bot.name, teamId);
    }

    bot.addToTeam(teamId);
    return await this._botRepository.save(bot);
  }

  private createRandomKey(length: number) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const bytes = Math.ceil(length * 3 / 4.0); // (4/3)*bytes = base64 string length.
      crypto.randomBytes(bytes, (error, buffer) => {
        if (error) {
          return reject(error);
        }

        const secret = buffer.toString('base64').replace(/\/|\+|=/g, "A");
        return resolve(secret);
      });
    });
  }
}
export default BotService;
