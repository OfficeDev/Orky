import {ArgumentNullException} from "../Errors";

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
