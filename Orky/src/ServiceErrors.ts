export class UnsupportedProtocolException extends Error {
  constructor(protocol: string) {
    const message = `Unsupported protocol '${protocol}.`
    super(message);
  }
}

export class BotNotConnectedException extends Error {
  constructor(botId: string) {
    const message = `Bot with id '${botId}' is not connected.`;
    super(message);
  }
}

export class BotNotFoundException extends Error {
  constructor(botIdOrName: string, teamId?: string) {
    let message = `Bot with id '${botIdOrName}' was not found.`;
    if (teamId) {
      message = `Bot with name '${botIdOrName}' in team '${teamId}' was not found.`;
    }
    super(message);
  }
}

export class BotResponseMalformedException extends Error {
  constructor(botIdOrName: string) {
    let message = `Bot with id '${botIdOrName}' responded with malformed data.`;
    super(message);
  }
}

export class CopyKeyNotFoundException extends Error {
  constructor(copyKey: string) {
    const message = `Bot with copy key '${copyKey}' was not found.`;
    super(message);
  }
}

export class BotIsDisabledException extends Error {
  constructor(botId: string) {
    const message = `Bot with id '${botId}' is disabled.`;
    super(message);
  }
}

export class BotAlreadyExistsException extends Error {
  constructor(botName: string, teamId: string) {
    const message = `Bot with name '${botName}' is already registered in team ${teamId}.`;
    super(message);
  }
}

export class ConnectionNotAuthorizedException extends Error {
  constructor() {
    const message = `Connection is not authorized.`;
    super(message);
  }
}