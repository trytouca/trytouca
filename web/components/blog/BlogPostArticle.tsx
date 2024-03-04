// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { PostOrPage } from '@tryghost/content-api';
import Link from 'next/link';
import React from 'react';
import { HiArrowNarrowRight, HiOutlineCalendar } from 'react-icons/hi';

export function BlogPostArticle({
  article,
  parent
}: {
  article: PostOrPage;
  parent: 'blog' | 'changelog';
}) {
  const articleLink = `/${parent}/${article.slug}`;
  return (
    <div className="flex w-full flex-col justify-between space-y-4 rounded-lg bg-dark-blue-800 shadow-xl">
      {article.feature_image && (
        <img
          className="w-full"
          src={article.feature_image}
          alt={article.feature_image_alt ?? undefined}
        />
      )}
      <div className="space-y-4 px-8 py-4">
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-yellow-500">
            {article.tags?.[0].name}
          </h5>
          <Link href={articleLink} title="Read this article">
            <h4 className="text-3xl font-medium text-white">{article.title}</h4>
          </Link>
        </div>
        {article.excerpt && (
          <blockquote className="text-lg text-gray-300">
            <p>{article.excerpt}</p>
          </blockquote>
        )}
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1 font-medium text-gray-300">
              <HiOutlineCalendar className="opacity-50" size="1.5rem" />
              <span>{article.published_at}</span>
            </div>
          </div>
          <div className="flex items-center">
            <Link href={articleLink} title="Read this article">
              <button
                className="group space-x-1 rounded-full bg-dark-blue-700 bg-opacity-25 px-4 py-2 text-gray-300 hover:text-white focus:underline focus:outline-none"
                type="button"
                role="button">
                <span className="text-sm font-medium leading-6">
                  Read Article
                </span>
                <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
