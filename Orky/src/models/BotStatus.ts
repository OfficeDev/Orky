import {ArgumentNullException} from "../Errors";
import {Bot} from "./Bot";

export enum Status {
  disconnected = 1,
  connected = 2,
  disabled = 3
}

export class BotStatus {
  readonly bot: Bot;
  readonly status: Status;

  constructor(bot: Bot, status: Status) {
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
