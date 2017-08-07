import {v4 as uuid} from "uuid";
import {ArgumentNullException} from "../Errors";

export class Bot {
  readonly teamId: string;
  readonly id: string;
  readonly secret: string;
  iconUrl: string;
  name: string;
  disabled: boolean;

  constructor(teamId: string, name: string, secret: string) {
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
    this.teamId = teamId;
    this.name = name;
    this.secret = secret;
    this.disabled = false;
    this.iconUrl = `https://robohash.org/${this.id}?size=56x56`;
  }
}
