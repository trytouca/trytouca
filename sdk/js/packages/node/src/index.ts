// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NodeClient } from './client';

const client = new NodeClient();
const touca = {
  configure: client.configure
};
export { touca };
export { VERSION } from './version';
