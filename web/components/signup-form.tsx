/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
 */

import React from 'react';

export default class SignupForm extends React.Component<{}, { umail: string }> {
  constructor(props) {
    super(props);
    this.state = { umail: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ umail: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    fetch('http://localhost:8081/auth/signup', {
      body: JSON.stringify({
        email: event.target.umail.value
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
      .then((res) => res.json())
      .then((res) => {
        event.target.reset();
        this.setState({ umail: '' });
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
            className="h-full overflow-hidden px-4 bg-green-600 text-white font-semibold rounded-md shadow-md border border-transparent focus:border-gray-200 focus:outline-none focus:ring-0"
            type="submit"
            role="button">
            Signup for Free
          </button>
        </div>
      </form>
    );
  }
}
