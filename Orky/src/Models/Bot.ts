// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {v4 as uuid} from "uuid";
import {ArgumentNullException} from "../Errors";

export class Bot {
  teamId: string[];
  readonly id: string;
  readonly secret: string;
  iconUrl: string;
  name: string;
  disabled: boolean;

  constructor(teamId: string | string[], name: string, secret: string) {
    if (!teamId) {
      throw new ArgumentNullException("teamId");
    }
    if (!name) {
      throw new ArgumentNullException("name");
    }
    if (!secret) {
      throw new ArgumentNullException("secret");
    }

    this.id = uuid();
    if (!Array.isArray(teamId)) {
      teamId = [teamId];
    }
    this.teamId = teamId;
    this.name = name;
    this.secret = secret;
    this.disabled = false;
    this.iconUrl = `https://robohash.org/${this.id}?size=56x56`;
  }

  addToTeam(teamId: string) {
    if (!this.teamId.includes(teamId)) {
      this.teamId.push(teamId);
    }
  }

  removeFromTeam(teamId: string) {
    const teamIdx = this.teamId.indexOf(teamId);
    if (teamIdx !== -1) {
      this.teamId.splice(teamIdx, 1);
    }
  }
}
export default Bot;
