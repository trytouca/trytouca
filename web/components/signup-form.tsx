/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import React from 'react';
import { event as gtag_event } from '@/lib/gtag';

interface Props {}

export default class SignupForm extends React.Component<{}, { umail: string }> {
  constructor(props: Props) {
    super(props);
    this.state = { umail: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ umail: event.target.value });
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetch('http://localhost:8081/auth/signup', {
      body: JSON.stringify({
        email: this.state.umail
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
      .then((res) => res.json())
      .then((res) => {
        this.setState({ umail: '' });
        gtag_event({ action: 'sign_up' });
      })
      .catch((e) => console.error(e));
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} noValidate={true}>
        <label className="wsl-input-label sr-only" htmlFor="umail">
          Email Address
        </label>
        <div className="flex h-10 space-x-2">
          <input
            className="flex-grow-0 lg:flex-grow h-full rounded-md shadow-md bg-white text-black border border-gray-300 focus:outline-none focus:border-gray-500 focus:ring-0"
            type="email"
            id="umail"
            name="umail"
            placeholder="Email address"
            required
            value={this.state.umail}
            onChange={this.handleChange}
          />
          <button
            className="wsl-btn-green px-4 h-full overflow-hidden rounded-md border border-transparent"
            type="submit"
            role="button">
            Signup for Free
          </button>
        </div>
      </form>
    );
  }
}
