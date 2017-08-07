import {Bot} from "../Models";

export interface IBotRepository {
  save(bot: Bot): Promise<Bot>;
  delete(bot: Bot): Promise<Bot|null>;
  deleteById(botId: string): Promise<Bot|null>;
  findById(botId: string): Promise<Bot|null>;
  findByTeamAndName(teamId: string, botName: string): Promise<Bot|null>;
  getAllByTeam(teamId: string): Promise<Bot[]>;
}
