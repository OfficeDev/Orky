import {ArgumentNullException} from "../Errors";
import {Bot} from "./Bot";

export class BotStatus {
  readonly bot: Bot;
  readonly status: string;

  constructor(bot: Bot, status: string) {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }
    if (!status) {
      throw new ArgumentNullException("status");
    }

    this.bot = bot;
    this.status = status;
  }
}
