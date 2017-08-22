import {ArgumentNullException, ArgumentOutOfRangeException} from "../Errors";
import Bot from "./Bot";

export class BotStatus {
  static DISCONNECTED = "disconnected";
  static CONNECTED = "connected";
  static DISABLED = "disabled";
  private static STATUSES=[BotStatus.DISCONNECTED, BotStatus.CONNECTED, BotStatus.DISABLED];

  readonly bot: Bot;
  readonly status: string;

  constructor(bot: Bot, status: string) {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }
    if (!status) {
      throw new ArgumentNullException("status");
    }
    if (!BotStatus.STATUSES.includes(status)) {
      throw new ArgumentOutOfRangeException("status", status, BotStatus.STATUSES);
    }

    this.bot = bot;
    this.status = status;
  }
}
export default BotStatus;
