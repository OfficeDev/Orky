import {v4 as uuid} from 'uuid';
import {ArgumentNullException} from './Errors'

export class Bot {
  readonly teamId: string;
  readonly id: string;
  readonly name: string;
  readonly secret: string;
  disabled: boolean;

  constructor(teamId: string, name: string, secret: string) {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    if (!name) {
      throw new ArgumentNullException("name");
    }
    if (!secret) {
      throw new ArgumentNullException("secret");
    }

    this.id = uuid();
    this.teamId = teamId;
    this.name = name;
    this.secret = secret;
    this.disabled = false;
  }

  thumbnailImageUri(): string {
    return `https://robohash.org/${this.id}?size=56x56`
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

export class User {
  readonly id: string;
  readonly name: string;

  constructor(id: string, name: string) {
    if (!id) {
      throw new ArgumentNullException("id");
    }
    if (!name) {
      throw new ArgumentNullException("name");
    }

    this.id = id;
    this.name = name;
  }
}

export class BotMessage {
  readonly id: string;
  readonly text: string;
  readonly teamId: string;
  readonly threadId: string;
  readonly channelId: string;
  readonly timestamp: Date;
  readonly sender: User;

  constructor(
    text: string,
    teamId: string,
    threadId: string,
    channelId: string,
    sender: User) {
    if (!text) {
      throw new ArgumentNullException("text");
    }
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    if (!threadId) {
      throw new ArgumentNullException("threadId");
    }
    if (!channelId) {
      throw new ArgumentNullException("channelId");
    }
    if (!sender) {
      throw new ArgumentNullException("sender");
    }

    this.id = uuid();
    this.text = text;
    this.teamId = teamId;
    this.threadId = threadId;
    this.channelId = channelId;
    this.sender = sender;
  }
}

export class BotResponse {
  readonly type: string;
  readonly messages: any[];

  constructor(type: string, messages: any[]) {
    if (!type) {
      throw new ArgumentNullException("type");
    }
    if (!messages) {
      throw new ArgumentNullException("messages");
    }

    this.type = type;
    this.messages = messages;
  }
}
