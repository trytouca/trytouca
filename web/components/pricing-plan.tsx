/**
 * Copyright 2021 Weasel, Inc. All rights reserved.
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

export default class PricingPlan extends React.Component<{ plan: Input }, {}> {
  render() {
    return (
      <div className="flex flex-col h-full shadow-xl">
        <div className="p-4 bg-light-blue-900 bg-opacity-75 rounded-t-lg space-y-2">
          <div className="flex justify-between">
            <div>
              <h4 className="text-xl text-white font-medium">
                {this.props.plan.title}
              </h4>
            </div>
            {!!this.props.plan.fee && (
              <div className="flex items-center justify-center">
                <p className="text-xl text-white font-medium">
                  <span>${this.props.plan.fee}</span>
                  <small className="text-sm opacity-75">/User/Month</small>
                </p>
              </div>
            )}
          </div>
          <p className="text-sm text-white">{this.props.plan.description}</p>
        </div>
        <div className="p-4 flex-grow flex flex-col justify-between bg-light-blue-900 bg-opacity-40 rounded-b-lg space-y-8">
          <div className="space-y-2">
            {this.props.plan.features.map((feature) => {
              return (
                <div className="flex space-x-4">
                  <HiOutlineBadgeCheck
                    className="text-green-600"
                    size="1.5rem"></HiOutlineBadgeCheck>
                  <p className="text-white font-medium leading-6">{feature}</p>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center">
            <a href={this.props.plan.button.link} rel="noopener">
              <button
                className="wsl-btn-green py-2 px-4 text-sm leading-6 rounded-lg"
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
