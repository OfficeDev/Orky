import {EventEmitter} from 'events';
import {ArgumentNullException, ArgumentException} from "../Errors";
import {Bot, BotMessage, BotResponse} from "../Models";
import {ILogger} from "../logging/Interfaces";
import {IBotRepository} from "../repositories/Interfaces";
import {IBotResponseHandler} from "./Interfaces";

export class BotConnection extends EventEmitter {
  private _bot: Bot;
  private _socket: SocketIO.Socket;
  private _responseTimeout: number;
  private _logger: ILogger;

  constructor(socket: SocketIO.Socket, botRepository: IBotRepository, responseTimeout: number, logger: ILogger) {
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
    this._responseTimeout = responseTimeout;

    this._socket.once('register', (botData) => {
      this._logger.info(`Registration request for ${JSON.stringify(botData, null, 2)}`);
      const botId = botData.id;
      const botSecret = botData.secret;

      if (!botId || !botSecret) {
        socket.emit('no_registration');
        socket.disconnect();
        this.emit('disconnected');
        return;
      }

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
          this.rename(bot.name);
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
    const event = `message-${message.id}`;
    this._socket.on(event, (data) => {
      const response = new BotResponse(data.type, data.messages);
      responseHandler(response);
    });

    // Remove listeners to clean up memory.
    setTimeout((event) => {
      this._socket.removeAllListeners(event);
    }, this._responseTimeout, event);

    this._socket.emit('post_message', message);
  }

  rename(name: string): void {
    this._socket.emit('registration_data', {id: this._bot.id, name: name});
  }
}
