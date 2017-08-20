import BotConnectionBase from "./BotConnectionBase";

export class BotConnectionV1 extends BotConnectionBase {
  rename(name: string): void {
    super.rename(name);
    this._socket.emit('registration_data', {id: this.botId, name: name});
  }
}
export default BotConnectionV1;
