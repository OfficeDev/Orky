import {ArgumentNullException, InvalidOperationException} from "../Errors";
import {Bot} from "../Models";
import {IDataStorage, IBotRepository} from "./Interfaces";
import {ILogger} from "../logging/Interfaces";

export class BotRepository implements IBotRepository {
  private _botsByTeamAndName: any;
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
    this._botsByTeamAndName = {};
    this._botsById = {};

    this.loadData()
      .catch((error) => {
        this._logger.error(error);
      })
  }

  async save(bot: Bot): Promise<Bot> {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    const originalBot = this._botsById[bot.id];
    if (originalBot && originalBot.name.toLowerCase() !== bot.name.toLowerCase()) {
      originalBot.teamId.forEach((teamId) => {
        delete this._botsByTeamAndName[teamId][originalBot.name.toLowerCase()];
      });
    }

    this._botsById[bot.id] = bot;
    bot.teamId.forEach((teamId) => {
      let teamMap = this._botsByTeamAndName[teamId]
      if (!teamMap) {
        teamMap = {};
        this._botsByTeamAndName[teamId] = teamMap;
      }
      teamMap[bot.name.toLowerCase()] = bot;
    });

    return this.saveData()
      .then(() => bot);
  }

  async deleteById(botId: string): Promise<Bot|null> {
    if (!botId) {
      throw new ArgumentNullException("botId");
    }

    return this.findById(botId)
      .then((bot) => {
        if (bot) {
          delete this._botsById[bot.id];
          bot.teamId.forEach((teamId) => {
            delete this._botsByTeamAndName[teamId][bot.name.toLowerCase()];
          });
        }
        
      return this.saveData()
      .then(() => bot);
      });
  }

  async findById(botId: string): Promise<Bot|null> {
    if (!botId) {
      throw new ArgumentNullException("botId");
    }

    return this.cloneBot(this._botsById[botId]);
  }

  async findByTeamAndName(teamId: string, botName: string): Promise<Bot|null> {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    if (!botName) {
      throw new ArgumentNullException("botName");
    }

    if (this._botsByTeamAndName[teamId]) {
      return this.cloneBot(this._botsByTeamAndName[teamId][botName.toLowerCase()]);
    }

    return null;
  }

  async getAllByTeam(teamId: string): Promise<Bot[]> {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }

    const botByName = this._botsByTeamAndName[teamId] || {};
    return Object.values(botByName).map((bot) => this.cloneBot(bot));
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
      bot.teamId.forEach((teamId) => {
        let teamMap = this._botsByTeamAndName[teamId]
        if (!teamMap) {
          teamMap = {};
          this._botsByTeamAndName[teamId] = teamMap;
        }
        teamMap[bot.name.toLowerCase()] = bot;
      });
    }

    this._logger.info(`Loaded ${Object.values(this._botsById).length} bots.`);
  }
}
