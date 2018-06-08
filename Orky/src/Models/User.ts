// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {ArgumentNullException} from "../Errors";

export class User {
  readonly id: string;
  readonly name: string;

  constructor(id: string, name: string) {
    if (!id) {
      throw new ArgumentNullException("id");
    }
    if (!name) {
      throw new ArgumentNullException("name");
    }

    this.id = id;
    this.name = name;
  }
}
export default User;
