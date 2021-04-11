/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
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
      <button className="wsl-btn-green px-4 py-2 text-base leading-6 rounded-lg shadow-md focus:ring-2 focus:ring-opacity-50 focus:ring-light-blue-400">
        Get Started
      </button>
    </div>
  );
}
