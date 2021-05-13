/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle
} from 'react-icons/hi';

const API_URL = process.env.NEXT_PUBLIC_WEASEL_API_URL;
const BASE_URL = process.env.basePath || '';

export function make_path(input: string): string {
  return `${BASE_URL}${input}`;
}

export async function post_json(path: string, body: Record<string, unknown>) {
  return fetch(`${API_URL}/${path}`, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
}

export async function extract_error(
  response: Response,
  messages: [number, string, string][]
): Promise<string> {
  const defaultMsg =
    'Something went wrong. Please try this operation again at a later time.';
  const body = await response.json();
  if (!Array.isArray(body.errors) || body.errors.length === 0) {
    return defaultMsg;
  }
  const msg = messages.find(
    (el) => response.status === el[0] && body.errors[0] === el[1]
  );
  return !msg ? defaultMsg : msg[2];
}

type FeedbackInput = {
  type: 'success' | 'warning' | 'error';
  message: string;
};

export const Feedback = (props: FeedbackInput) => {
  const icons = {
    success: HiOutlineCheckCircle,
    warning: HiOutlineExclamationCircle,
    error: HiOutlineExclamationCircle
  };
  const colors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  };
  const Icon = icons[props.type];
  return (
    <div className={'mt-2 flex items-center space-x-2 ' + colors[props.type]}>
      <Icon></Icon>
      <small>{props.message}</small>
    </div>
  );
};
