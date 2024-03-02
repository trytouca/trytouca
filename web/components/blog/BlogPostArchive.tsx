// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { PostOrPage } from '@tryghost/content-api';
import React from 'react';

import { BlogPostArticle } from '@/components/blog/BlogPostArticle';

export function BlogPostArchive({
  articles,
  parent
}: {
  articles: PostOrPage[];
  parent: 'blog' | 'changelog';
}) {
  return (
    <div className="container mx-auto px-4 py-32 lg:px-8">
      <h2 className="pb-16 text-4xl font-bold text-white">Other Articles</h2>
      <div className="grid gap-8 lg:grid-cols-2 xl:gap-16">
        {articles.map((article, index) => (
          <div key={index} className="flex grid-cols-1 items-stretch">
            <BlogPostArticle article={article} parent={parent} />
          </div>
        ))}
      </div>
    </div>
  );
}
