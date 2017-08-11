import {Bot} from "../Models";

export interface IDataStorage {
  save(data: any) : Promise<void>;
  load() : Promise<any>;
}

export interface IBotRepository {
  save(bot: Bot): Promise<Bot>;
  deleteById(botId: string): Promise<Bot|null>;
  findById(botId: string): Promise<Bot|null>;
  findByTeamAndName(teamId: string, botName: string): Promise<Bot|null>;
  getAllByTeam(teamId: string): Promise<Bot[]>;
}
