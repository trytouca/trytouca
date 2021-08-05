import { NodeClient, NodeOptions } from './client';

let instance: NodeClient;

/**
 *
 */
function getClient(): NodeClient {
  if (!instance) {
    instance = new NodeClient();
  }
  return instance;
}

/**
 *
 */
export function configure(options: NodeOptions = {}): void {
  getClient().init(options);
}

/**
 *
 */
export function declare_testcase(slug: string): void {
  getClient().testcase(slug);
}

/**
 *
 */
export function add_result(key: string, value: unknown): void {
  getClient().add_result(key, value);
}

/**
 *
 */
export async function post(timeout?: number): Promise<boolean> {
  return getClient().post(timeout);
}
