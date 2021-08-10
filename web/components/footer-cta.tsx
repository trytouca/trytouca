/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

export default function FooterCta() {
  return (
    <div className="grid lg:p-8 gap-y-20 lg:grid-cols-2">
      <div className="space-y-4 text-white">
        <h3 className="text-2xl font-bold wsl-text-shadow xl:text-3xl">
          See our product for yourself
        </h3>
        <p className="text-xl">It could change how you build software.</p>
        <div>
          <a
            href="https://app.touca.io"
            target="_blank"
            rel="noopener noreferrer">
            <button
              className="px-4 py-2 text-base leading-6 rounded-lg shadow-md wsl-btn-green focus:ring-2 focus:ring-opacity-50 focus:ring-light-blue-400"
              type="button">
              Get Started
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
