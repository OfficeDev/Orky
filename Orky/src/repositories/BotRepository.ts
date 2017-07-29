import {Bot} from "../Models";
import {ArgumentNullException} from "../Errors";

export interface IBotRepository {
  save(bot: Bot): Promise<Bot>;
  delete(bot: Bot): Promise<Bot|undefined>;
  deleteById(botId: string): Promise<Bot|undefined>;
  findById(botId: string): Promise<Bot|undefined>;
  findByTeamAndName(teamId: string, botName: string): Promise<Bot|undefined>;
  getAllByTeam(teamId: string): Promise<Bot[]>;
}

export class BotMemoryRepository implements IBotRepository {
  private _botsByTeamAndName: any;
  private _botsById: any;

  constructor() {
    this._botsByTeamAndName = {};
    this._botsById = {};
  }

  async save(bot: Bot): Promise<Bot> {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    this._botsById[bot.id] = bot;
    let teamMap = this._botsByTeamAndName[bot.teamId]
    if (!teamMap) {
      teamMap = {};
      this._botsByTeamAndName[bot.teamId] = teamMap;
    }
    teamMap[bot.name.toLowerCase()] = bot;

    return bot;
  }

  async delete(bot: Bot): Promise<Bot|undefined> {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    return this.deleteById(bot.id);
  }

  async deleteById(botId: string): Promise<Bot|undefined> {
    if (!botId) {
      throw new ArgumentNullException("botId");
    }

    return this.findById(botId)
      .then((bot) => {
        if (bot) {
          delete this._botsById[bot.id];
          delete this._botsByTeamAndName[bot.teamId][bot.name.toLowerCase()];
        }
        return bot;
      });
  }

  async findById(botId: string): Promise<Bot|undefined> {
    if (!botId) {
      throw new ArgumentNullException("botId");
    }

    return this._botsById[botId];
  }

  async findByTeamAndName(teamId: string, botName: string): Promise<Bot|undefined> {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    if (!botName) {
      throw new ArgumentNullException("botName");
    }

    if (this._botsByTeamAndName[teamId]) {
      return this._botsByTeamAndName[teamId][botName.toLowerCase()];
    }

    return undefined;
  }

  async getAllByTeam(teamId: string): Promise<Bot[]> {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }

    const botByName = this._botsByTeamAndName[teamId] || {};
    return Object.values(botByName);
  }
}
