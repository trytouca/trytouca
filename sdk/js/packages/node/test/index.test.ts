/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NodeClient } from '../src/client';

test('basic api', async () => {
  const client = new NodeClient();
  client.init({});
  client.add_result('some-key', 'some-value');
  expect(await client.post()).toBe(false);
});
