// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.
'use client';

import { useState } from 'react';
import { HiArrowNarrowRight } from 'react-icons/hi';

type CommonQuestionsProps = {
  title: string;
  blocks: {
    question: string;
    answer: string[];
  }[];
};

export default function CommonQuestions({
  content
}: {
  content: CommonQuestionsProps;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center px-4 py-32 lg:px-8">
      <h2 className="pb-16 text-4xl font-bold text-white">{content.title}</h2>
      <div className="grid gap-8 lg:grid-cols-2 xl:gap-16">
        <div className="grid-cols-1 space-y-2">
          {content.blocks.map((block, index) => {
            const isActive = index === activeIndex;
            const left = isActive
              ? 'bg-dark-blue-700 bg-opacity-20'
              : 'hover:bg-dark-blue-700 hover:bg-opacity-10';
            const right = isActive ? '' : 'hidden';
            return (
              <div
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center justify-between rounded-lg p-4 duration-300 ease-in-out ${left}`}>
                <h3 className="text-medium text-xl text-white lg:text-2xl">
                  {block.question}
                </h3>
                <HiArrowNarrowRight
                  className={`text-2xl text-yellow-500 ${right}`}
                />
              </div>
            );
          })}
        </div>
        <div className="grid-cols-1">
          <div className="space-y-4 rounded-lg bg-dark-blue-700 bg-opacity-20 p-8">
            {content.blocks[activeIndex].answer.map((text, index) => (
              <p key={index} className="text-xl text-gray-300">
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
