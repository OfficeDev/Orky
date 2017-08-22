import {ArgumentNullException} from "../../Errors";
import {ILogger} from "../../logging/Interfaces";
import BotConnectionBase from "./BotConnectionBase";

export class BotConnectionV2 extends BotConnectionBase {
  rename(name: string): void {
    super.rename(name);
    this._socket.emit('rename', name);
  }
}

export default BotConnectionV2;
