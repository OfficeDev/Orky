import {ArgumentNullException} from './Errors'

export class Bot {
  readonly teamId: string;
  readonly id: string;
  readonly name: string;
  readonly secret: string;
  disabled: boolean;
  readonly number: number;

  constructor(teamId: string, id: string, name: string, secret: string) {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    if (!id) {
      throw new ArgumentNullException("id");
    }
    if (!name) {
      throw new ArgumentNullException("name");
    }
    if (!secret) {
      throw new ArgumentNullException("secret");
    }

    this.teamId = teamId;
    this.id = id;
    this.name = name;
    this.secret = secret;
    this.disabled = false;
    this.number = Math.floor(Math.random() * 4) + 1;
  }
}

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
