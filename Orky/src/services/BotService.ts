import * as crypto from 'crypto';
import * as SocketIO from "socket.io";
import {ArgumentNullException, ArgumentException} from "../Errors";
import {Bot, BotStatus, Status, BotMessage, BotResponse} from "../Models";
import {ILogger} from "../logging/Interfaces";
import {IBotRepository} from "../repositories/Interfaces";
import {IBotResponseHandler, IBotService} from "./Interfaces";
import {BotConnection} from "./BotConnection";

export class BotService implements IBotService {
  private _botRepository: IBotRepository;
  private _logger: ILogger;
  private _responseTimeout: number;
  private _botKeepDuration: number;
  private _botConnections: {[key:string]: BotConnection};

  constructor(botRepository: IBotRepository, logger: ILogger, responseTimeout: number, botKeepDuration: number) {
    if (!botRepository) {
      throw new ArgumentNullException("botRepository");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    this._botRepository = botRepository;
    this._botConnections = {};
    this._logger = logger;
    this._responseTimeout = responseTimeout;
    this._botKeepDuration = botKeepDuration;
  }

  establishConnection(socket: SocketIO.Socket): void {
    const connection = new BotConnection(socket, this._botRepository, this._responseTimeout, this._logger);
    connection.once('registered', (botId) => {
      if (this._botConnections[botId]) {
          this._botConnections[botId].disconnect();
      }
      this._botConnections[botId] = connection;

      connection.once('disconnected', (botId) => {
        if (botId && connection === this._botConnections[botId]) {
          delete this._botConnections[botId];
        }
      });
    });
  }

  async registerBotWithName(teamId: string, botName: string): Promise<Bot|null> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (bot) {
          return Promise.resolve(null);
        }
        
        return this.createBotSecret()
          .then((secret) => {
            const bot = new Bot(teamId, botName, secret);
            return this._botRepository.save(bot)
          })
      })
      .then((bot) => {
        if (bot && this._botKeepDuration) {
          setTimeout((botId: string) => {
            // Delete the bot
            this._botRepository.deleteById(botId)
              .then((bot) => {
                // Kill the connection
                if (this._botConnections[botId]) {
                  this._botConnections[botId].disconnect();
                }
                delete this._botConnections[botId];
              });
          }, this._botKeepDuration, bot.id);
        }
        return bot;
      });
  }

  async deregisterBotWithName(teamId: string, botName: string): Promise<Bot|null> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(null);
        }

        return this._botRepository.deleteById(bot.id);
      });
  }

  async enableBotWithName(teamId: string, botName: string): Promise<Bot|null> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(null);
        }

        bot.disabled = false;
        return this._botRepository.save(bot);
      });
  }

  async disableBotWithName(teamId: string, botName: string): Promise<Bot|null> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(null);
        }

        bot.disabled = true;
        return this._botRepository.save(bot);
      });
  }

  async renameBot(teamId: string, fromName: string, toName: string): Promise<Bot|null> {
    return this._botRepository
      .findByTeamAndName(teamId, toName)
      .then((bot) => {
        // Fail if there is another bot with the same toName.
        // If the toName is the same as the bot's name and only casing is different
        // then we should rename it still.
        if (bot) {
          if (bot.name.toLowerCase() === toName.toLowerCase()) {
            return bot;
          }
          return Promise.resolve(null);
        }

        return this._botRepository
          .findByTeamAndName(teamId, fromName);
      })
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(null);
        }

        bot.name = toName;
        return this._botRepository.save(bot);
      })
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(null);
        }

        const connection = this.getBotConnection(bot);
        if (connection) {
          connection.rename(toName);
        }

        return Promise.resolve(bot);
      });
  }

  async doesBotExist(teamId: string, botName: string) : Promise<boolean> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(false);
        }
        return Promise.resolve(true);
      });
  }

  async getBotStatuses(teamId: string): Promise<BotStatus[]> {
    return this._botRepository.getAllByTeam(teamId)
      .then((bots) => {
        const statuses = new Array<BotStatus>();
        bots.forEach((bot) => {
          let status = Status.disconnected;
          if (bot.disabled) {
            status = Status.disabled;
          }
          else if (this._botConnections[bot.id]) {
            status = Status.connected;
          }
          statuses.push(new BotStatus(bot, status));
        });
        return statuses;
      });
  }

  async sendMessageToBot(teamId: string, botName: string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<Bot|null> {
    return this._botRepository.findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return null;
        }

        if (bot.disabled) {
          return null;
        }

        const connection = this.getBotConnection(bot);
        if (!connection) {
          return null;
        }

        connection.sendMessage(message, responseHandler);
        return bot;
      });
  }

  private getBotConnection(bot: Bot): BotConnection|null {
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    return this._botConnections[bot.id];
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
