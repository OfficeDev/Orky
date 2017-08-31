// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import BotConnectionBase from "./BotConnectionBase";

export class BotConnectionV1 extends BotConnectionBase {
  rename(name: string): void {
    super.rename(name);
    this._socket.emit('registration_data', {id: this.botId, name: name});
  }
}
export default BotConnectionV1;
