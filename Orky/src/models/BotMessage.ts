// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {v4 as uuid} from "uuid";
import {ArgumentNullException} from "../Errors";
import User from "./User";

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
export default BotMessage;