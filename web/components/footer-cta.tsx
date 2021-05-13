/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

export default function FooterCta() {
  return (
    <div className="text-white space-y-4">
      <h3 className="wsl-text-shadow text-2xl xl:text-3xl font-bold">
        Try Weasel today
      </h3>
      <p className="text-xl">
        We make maintaining software 10x more efficient.
      </p>
      <div>
        <a
          href="https://app.getweasel.com"
          target="_blank"
          rel="noopener noreferrer">
          <button
            className="wsl-btn-green px-4 py-2 text-base leading-6 rounded-lg shadow-md focus:ring-2 focus:ring-opacity-50 focus:ring-light-blue-400"
            type="button">
            Get Started
          </button>
        </a>
      </div>
    </div>
  );
}
