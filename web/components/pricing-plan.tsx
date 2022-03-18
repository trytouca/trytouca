// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import React from 'react';
import { HiOutlineBadgeCheck } from 'react-icons/hi';

export type Input = {
  title: string;
  features: string[];
  fee: {
    class: string;
    suffix: string[];
    text: string;
  };
};

export default class PricingPlan extends React.Component<
  { plan: Input },
  Record<string, never>
> {
  render() {
    return (
      <div className="h-full space-y-8 rounded-xl border border-dark-blue-700 bg-dark-blue-800 bg-opacity-90 p-8 shadow-xl">
        <h4 className="text-center text-xl font-medium text-white">
          {this.props.plan.title}
        </h4>
        <div className="flex items-center justify-center space-x-4 border-b border-dark-blue-700 px-4 pb-8 md:px-8">
          <p className={`px-1 font-bold ${this.props.plan.fee.class}`}>
            {this.props.plan.fee.text}
          </p>
          {this.props.plan.fee.suffix && (
            <div>
              {this.props.plan.fee.suffix.map((suffix, index) => {
                return (
                  <p key={index} className="text-lg font-medium text-white">
                    {suffix}
                  </p>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-grow flex-col justify-between rounded-b-lg px-4 md:px-8">
          <div className="space-y-2">
            {this.props.plan.features.map((feature, index) => {
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
      </div>
    );
  }
}
