// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {Session} from "botbuilder";
import {User} from "../Models";
import {ArgumentNullException} from "../Errors";

export class SessionUtils {
  static extractTeamId(session: Session) : string | null {
    if (!session) {
      throw new ArgumentNullException("session");
    }
    let teamId = null;
    if (session && session.message) {
      if (session.message.user) {
        teamId = session.message.user.id;
      }
      if (session.message.sourceEvent && session.message.sourceEvent.team) {
        teamId = session.message.sourceEvent.team.id;
      }
    }

    return teamId;
  }

  static extractSender(session: Session) : User {
    if (!session) {
      throw new ArgumentNullException("session");
    }
    return new User(
      session.message.address.user.id,
      session.message.address.user.name || "");
  }
}
export default SessionUtils;
