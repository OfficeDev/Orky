import * as fs from "fs";
import {ArgumentNullException, InvalidOperationException} from "../Errors";
import {Bot} from "../Models";
import {IBotRepository} from "./Interfaces";
import {ILogger} from "../logging/Interfaces";

export class BotFileRepository implements IBotRepository {
  private _botsByTeamAndName: any;
  private _botsById: any;
  private _logger: ILogger
  private _filePath: string;

  constructor(logger: ILogger, filePath: string) {
    if (!logger) {
      throw new ArgumentNullException('logger');
    }
    if (!filePath) {
      throw new ArgumentNullException('filePath');
    }
    this._logger = logger;
    this._filePath = filePath;

    this.loadData();
  }

  async save(bot: Bot): Promise<Bot> {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    const originalBot = this._botsById[bot.id];
    if (originalBot && originalBot.name.toLowerCase() !== bot.name.toLowerCase()) {
      delete this._botsByTeamAndName[originalBot.teamId][originalBot.name.toLowerCase()];
    }

    this._botsById[bot.id] = bot;
    let teamMap = this._botsByTeamAndName[bot.teamId]
    if (!teamMap) {
      teamMap = {};
      this._botsByTeamAndName[bot.teamId] = teamMap;
    }
    teamMap[bot.name.toLowerCase()] = bot;

    return this.saveData()
      .then(() => bot);
  }

  async delete(bot: Bot): Promise<Bot|null> {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    return this.deleteById(bot.id);
  }

  async deleteById(botId: string): Promise<Bot|null> {
    if (!botId) {
      throw new ArgumentNullException("botId");
    }

    return this.findById(botId)
      .then((bot) => {
        if (bot) {
          delete this._botsById[bot.id];
          delete this._botsByTeamAndName[bot.teamId][bot.name.toLowerCase()];
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

  private loadData() : void {
    this._botsByTeamAndName = {};
    this._botsById = {};
    
    try {
      const file = fs.readFileSync(this._filePath, {encoding: 'UTF8'});
      const data = JSON.parse(file);

      for (const key in data) {
        const value = data[key];
        if(!value.teamId || !value.name || !value.id || !value.secret) {
          throw new InvalidOperationException(`File '${this._filePath}' is corrupt.`);
        }

        const bot = new Bot(value.teamId, value.name, value.secret);
        bot.disabled = value.disabled;
        bot.iconUrl = value.iconUrl || bot.iconUrl;
        (bot as any).id = value.id; // force the id
        this._botsById[value.id] = bot;
        let teamMap = this._botsByTeamAndName[bot.teamId]
        if (!teamMap) {
          teamMap = {};
          this._botsByTeamAndName[bot.teamId] = teamMap;
        }
        teamMap[bot.name.toLowerCase()] = bot;
      }

      this._logger.info(`Loaded ${Object.values(this._botsById).length} bots from file.`);
    }
    catch (error) {
      this._logger.info(`Failed to load data from file '${this._filePath}'`);

      // File did not exist so its all ok.
      if (error.code !== 'ENOENT') {
        this._logger.error(error);
        throw error;
      }
    }
  }

  private async saveData() : Promise<void> {
    const content = JSON.stringify(this._botsById);
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(this._filePath, content, {encoding: 'UTF8'}, (error) => {
        if (error) {
          this._logger.error(error.message);
          return reject(error);
        }

        this._logger.info("Data saved to file!");
        return resolve();
      });
    });
  }
}
