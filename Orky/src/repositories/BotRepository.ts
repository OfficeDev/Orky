// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {ArgumentNullException, InvalidOperationException} from "../Errors";
import {Bot} from "../Models";
import {IDataStorage, IBotRepository} from "./Interfaces";
import {ILogger} from "../logging/Interfaces";
import {BotNotFoundException} from "../ServiceErrors";

export class BotRepository implements IBotRepository {
  private _botsById: {[key: string]: Bot};
  private _storage: IDataStorage;
  private _logger: ILogger

  constructor(storage: IDataStorage, logger: ILogger) {
    if (!storage) {
      throw new ArgumentNullException("storage");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    this._storage = storage;
    this._logger = logger;
    this._botsById = {};

    this.loadData()
      .catch((error) => {
        this._logger.logException(error);
      })
  }

  async save(bot: Bot): Promise<Bot> {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    this._botsById[bot.id] = bot;

    await this.saveData();
    return this.cloneBot(bot);
  }

  async deleteById(botId: string): Promise<Bot> {
    if (!botId) {
      throw new ArgumentNullException("botId");
    }

    const bot = await this.findById(botId);
    delete this._botsById[bot.id];
    
    await this.saveData();
    return bot;
  }

  async findById(botId: string): Promise<Bot> {
    if (!botId) {
      throw new ArgumentNullException("botId");
    }

    const bot = this._botsById[botId];
    if (!bot) {
      throw new BotNotFoundException(botId);
    }

    return this.cloneBot(bot);
  }

  async findByTeamAndName(teamId: string, botName: string): Promise<Bot> {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    if (!botName) {
      throw new ArgumentNullException("botName");
    }

    const botIds = Object.keys(this._botsById);
    while(botIds.length > 0) {
      const botId = botIds.shift() as string;
      const bot = this._botsById[botId];
      if (bot.teamId.includes(teamId) && bot.name.toLowerCase() === botName.toLowerCase()) {
        return this.cloneBot(bot);
      }
    }

    throw new BotNotFoundException(botName, teamId);
  }

  async exists(teamId: string, botName: string): Promise<boolean> {
    const botIds = Object.keys(this._botsById);
    while(botIds.length > 0) {
      const botId = botIds.shift() as string;
      const bot = this._botsById[botId];
      if (bot.teamId.includes(teamId) && bot.name.toLowerCase() === botName.toLowerCase()) {
        return true;
      }
    }

    return false;
  }

  async getAllByTeam(teamId: string): Promise<Bot[]> {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    
    const bots = []
    const botIds = Object.keys(this._botsById);
    while(botIds.length > 0) {
      const botId = botIds.shift() as string;
      const bot = this._botsById[botId];
      if (bot.teamId.includes(teamId)) {
        bots.push(this.cloneBot(bot));
      }
    }
    return bots;
  }

  private cloneBot(bot: Bot): Bot {
    if (!bot) {
      return bot;
    }
    const shadowBot = new Bot(bot.teamId, bot.name, bot.secret) as any;
    shadowBot.disabled = bot.disabled;
    shadowBot.id = bot.id;
    shadowBot.iconUrl = bot.iconUrl;
    return shadowBot;
  }

  private async saveData(): Promise<void> {
    await this._storage.save(this._botsById);
  }

  private async loadData(): Promise<void> {
    const data = await this._storage.load();
    for (const key in data) {
      const value = data[key];
      if(!value.teamId || !value.name || !value.id || !value.secret) {
        throw new InvalidOperationException(`Stored data is corrupt.`);
      }

      const bot = new Bot(value.teamId, value.name, value.secret);
      bot.disabled = value.disabled;
      bot.iconUrl = value.iconUrl || bot.iconUrl;
      (bot as any).id = value.id; // force the id
      this._botsById[value.id] = bot;
    }

    this._logger.info(`Loaded ${Object.values(this._botsById).length} bots.`);
  }
}
export default BotRepository;
