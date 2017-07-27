import * as crypto from 'crypto';
import * as SocketIO from "socket.io";
import {v4 as uuid} from 'uuid';
import {Bot, BotStatus} from "../Models";
import {IBotRepository} from "../repositories/BotRepository";
import {ArgumentNullException} from "../Errors";

export default class BotService {
  private _botRepository: IBotRepository;
  private _botConnections: {[key:string]: SocketIO.Socket};

  constructor(botRepository: IBotRepository) {
    if (!botRepository) {
      throw new ArgumentNullException("botRepository");
    }
    this._botRepository = botRepository;
    this._botConnections = {};
  }

  establishConnection(socket: SocketIO.Socket): void {
    socket.on('good day', (data) => {
      this._botRepository.findById(data)
        .then((bot) => {
          if (!bot) {
            socket.emit('goodbye');
            return;
          }

          socket.on('disconnect', () => {
            delete this._botConnections[bot.id];
          });

          socket.on('great', () => {
            this._botConnections[bot.id] = socket;
          });

          socket.emit('how are you', bot.secret);
        });
    });

    socket.emit('hello');
  }

  async registerBotWithName(teamId: string, botName: string): Promise<Bot|undefined> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (bot) {
          return Promise.resolve(undefined);
        }
        
        return this.createBotSecret()
          .then((secret) => {
            const botId = uuid();
            const bot = new Bot(teamId, botId, botName, secret);
            return this._botRepository.save(bot);
          })
      });
  }

  async deregisterBotWithName(teamId: string, botName: string): Promise<Bot|undefined> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(undefined);
        }

        return this._botRepository.delete(bot);
      });
  }

  async getBotStatuses(teamId: string): Promise<BotStatus[]> {
    return this._botRepository.getAllByTeam(teamId)
      .then((bots) => {
        const statuses = new Array<BotStatus>();
        bots.forEach((bot) => {
          let status = "disconnected";
          if (this._botConnections[bot.id]) {
            status = "connected";
          }
          statuses.push(new BotStatus(bot, status));
        });
        return statuses;
      });
  }

  async sendMessageToBot(teamId: string, botName: string, message: any): Promise<any> {
    return this._botRepository.findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return undefined;
        }

        const socket = this._botConnections[bot.id];
        if (!socket || !socket.connected) {
          return undefined;
        }
        
        message = {
          text: message.text,
          type: message.type,
          timestamp: message.timestampe,
          localTimestamp: message.localTimestamp,
          address: message.address,
          user: message.user,
          token: message.token
        };

        socket.emit('message', message);
        return bot;
      });
  }

  private async createBotSecret() : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      crypto.randomBytes(24, (error, buffer) => {
        if (error) {
          return reject(error);
        }

        const secret = buffer.toString('base64').replace(/\/|\+|=/g, "");
        return resolve(secret);
      });
    });
  }
}
