// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NodeClient } from './client';

const client = new NodeClient();
export { client as touca };
export { VERSION } from './version';
