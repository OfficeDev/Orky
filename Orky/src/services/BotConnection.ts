import {EventEmitter} from 'events';
import {v4 as uuid} from 'uuid';
import {Bot, BotStatus, BotMessage, BotResponse} from "../Models";
import {ILogger} from "../Logger";
import {ArgumentNullException, ArgumentException} from "../Errors";
import {IBotRepository} from "../repositories/BotRepository";
import {IBotResponseHandler} from "./Interfaces";

export class BotConnection extends EventEmitter {

  private _bot: Bot;
  private _socket: SocketIO.Socket;
  private _logger: ILogger;

  constructor(socket: SocketIO.Socket, botRepository: IBotRepository, logger: ILogger) {
    super();
    if (!socket) {
      throw new ArgumentNullException("socket");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    if (!socket.connected) {
      throw new ArgumentException("socket", "Socket is not connected.");
    }

    this._logger = logger;
    this._socket = socket;

    this._socket.once('register', (botData) => {
      this._logger.info(`Registration request for ${JSON.stringify(botData, null, 2)}`);
      const botId = botData.id;
      const botSecret = botData.secret;

      botRepository.findById(botId)
        .then((bot) => {
          if (!bot || bot.secret !== botSecret) {
            this._logger.info(`No registration data found for id ${botId}`);
            socket.emit('no_registration');
            socket.disconnect();
            this.emit('disconnected');
            return;
          }
          this._bot = bot;

          this._logger.info(`${bot.name} (${bot.id}) successfully registered.`);
          socket.emit('registration_data', {id: bot.id, name: bot.name});
          this.emit('registered', bot.id);

          this._socket.once('disconnect', () => {
            this._logger.info(`${bot.name} (${bot.id}) disconnected.`);
            this.emit('disconnected', bot.id);
          });
        });
    });
  }

  disconnect(): void {
    this._socket.disconnect();
    this.emit('disconnected', this._bot.id);
  }

  sendMessage(message: BotMessage, responseHandler: IBotResponseHandler): void {
    this._socket.on(`message-${message.id}`, (data) => {
      const response = new BotResponse(data.type, data.messages);
      responseHandler(response);
    });

    //TODO reject on timeout..
    this._socket.emit('post_message', message);
  }
}
