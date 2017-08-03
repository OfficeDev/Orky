import {Bot} from "../Models";

export interface IBotRepository {
  save(bot: Bot): Promise<Bot>;
  delete(bot: Bot): Promise<Bot|undefined>;
  deleteById(botId: string): Promise<Bot|undefined>;
  findById(botId: string): Promise<Bot|undefined>;
  findByTeamAndName(teamId: string, botName: string): Promise<Bot|undefined>;
  getAllByTeam(teamId: string): Promise<Bot[]>;
}