import {Bot} from "../Models";

export interface IDataStorage {
  save(data: any) : Promise<void>;
  load() : Promise<any>;
}

export interface IBotRepository {
  save(bot: Bot): Promise<Bot>;
  deleteById(botId: string): Promise<Bot>;
  findById(botId: string): Promise<Bot>;
  findByTeamAndName(teamId: string, botName: string): Promise<Bot>;
  exists(teamId: string, botName: string): Promise<boolean>;
  getAllByTeam(teamId: string): Promise<Bot[]>;
}
