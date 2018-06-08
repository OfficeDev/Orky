// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
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
export default BotResponse;
