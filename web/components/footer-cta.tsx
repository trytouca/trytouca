// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { HiArrowNarrowRight } from 'react-icons/hi';

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
            className="text-lg"
            href="https://app.touca.io"
            target="_blank"
            rel="noopener noreferrer">
            <button
              style={{ boxShadow: '0 0 5px #7dd3fc' }}
              className="p-3 space-x-2 font-medium text-white duration-150 ease-in-out bg-opacity-25 box-shadow rounded-xl focus:outline-none bg-dark-blue-700 hover:bg-opacity-50 group"
              type="button"
              role="button">
              <span>Get Started for Free</span>
              <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
