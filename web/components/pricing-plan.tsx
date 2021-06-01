/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import React from 'react';
import { HiOutlineBadgeCheck } from 'react-icons/hi';

export type Input = {
  title: string;
  description: string;
  features: string[];
  fee?: number;
  button: {
    title: string;
    link: string;
  };
};

export default class PricingPlan extends React.Component<
  { plan: Input },
  Record<string, never>
> {
  render() {
    return (
      <div className="flex flex-col h-full shadow-xl">
        <div className="p-4 space-y-2 bg-opacity-75 rounded-t-lg bg-light-blue-900">
          <div className="flex justify-between">
            <div>
              <h4 className="text-xl font-medium text-white">
                {this.props.plan.title}
              </h4>
            </div>
            {!!this.props.plan.fee && (
              <div className="flex items-center justify-center">
                <p className="text-xl font-medium text-white">
                  <span>${this.props.plan.fee}</span>
                  <small className="text-sm opacity-75">/User/Month</small>
                </p>
              </div>
            )}
          </div>
          <p className="text-sm text-white">{this.props.plan.description}</p>
        </div>
        <div className="flex flex-col justify-between flex-grow p-4 space-y-8 rounded-b-lg bg-light-blue-900 bg-opacity-40">
          <div className="space-y-2">
            {this.props.plan.features.map((feature, index) => {
              return (
                <div key={index} className="flex space-x-4">
                  <HiOutlineBadgeCheck
                    className="text-green-600"
                    size="1.5rem"></HiOutlineBadgeCheck>
                  <p className="font-medium leading-6 text-white">{feature}</p>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center">
            <a href={this.props.plan.button.link} rel="noopener">
              <button
                className="px-4 py-2 text-sm leading-6 rounded-lg wsl-btn-green"
                type="button">
                {this.props.plan.button.title}
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
