// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { HiOutlineBadgeCheck } from 'react-icons/hi';

export type Input = {
  title: string;
  features: string[];
  fee: {
    prefix?: string;
    class: string;
    suffix: string[];
    text: string;
  };
  cta?: {
    text: string;
    href: string;
  };
};

export default function PricingPlan({ plan }: { plan: Input }) {
  return (
    <div className="h-full space-y-12 rounded-xl border border-dark-blue-700 bg-dark-blue-800 bg-opacity-90 px-4 py-8 shadow-xl">
      <h4 className="text-center text-xl font-medium text-white">
        {plan.title}
      </h4>
      <div className="space-y-2 border-b border-dark-blue-700 px-4 pb-8">
        {plan.fee.prefix && (
          <p className="text-center text-gray-300">{plan.fee.prefix}</p>
        )}
        <div className="flex items-center justify-center space-x-4">
          <p className={`px-1 font-bold ${plan.fee.class}`}>{plan.fee.text}</p>
          {plan.fee.suffix && (
            <div>
              {plan.fee.suffix.map((suffix, index) => {
                return (
                  <p key={index} className="text-lg font-medium text-white">
                    {suffix}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-between rounded-b-lg px-4 md:px-8">
        <div className="space-y-2">
          {plan.features.map((feature, index) => {
            return (
              <div key={index} className="flex space-x-4">
                <HiOutlineBadgeCheck
                  className="text-sky-600"
                  size="1.5rem"></HiOutlineBadgeCheck>
                <p className="text-lg font-medium leading-6 text-white">
                  {feature}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-grow flex-col justify-end">
        {plan.cta && <PlanButton input={plan.cta}></PlanButton>}
      </div>
    </div>
  );
}

function PlanButton(props: { input: { href: string; text: string } }) {
  return (
    <a
      className="block text-lg"
      href={props.input.href}
      target="_blank"
      rel="noopener noreferrer">
      <button
        className="w-full rounded-xl border border-sky-800 bg-dark-blue-700 bg-opacity-25 p-3 font-medium text-white duration-150 ease-in-out hover:bg-opacity-50 focus:outline-none"
        type="button"
        role="button">
        {props.input.text}
      </button>
    </a>
  );
}
