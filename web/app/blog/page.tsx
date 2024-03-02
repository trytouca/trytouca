// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Metadata } from 'next';
import React from 'react';

import { BlogPostArchive } from '@/components/blog/BlogPostArchive';
import { BlogPostArticle } from '@/components/blog/BlogPostArticle';
import { fetchArticles } from '@/components/utils/blog';

export const metadata: Metadata = {
  title: 'Blog',
  alternates: { canonical: '/blog' }
};

export default async function Page() {
  const { archived_articles, main_article } = await fetchArticles('blog');
  return (
    <>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="grid grid-cols-1 gap-4 space-y-8 p-8 lg:grid-cols-2 lg:space-y-0">
            <div className="col-span-1 grid place-content-center">
              <div className="max-w-lg space-y-4 text-white">
                <h3 className="text-4xl font-bold lg:text-5xl">Touca Blog</h3>
                <p className="text-xl font-light text-white lg:text-2xl">
                  Towards making software easier to change, cheaper to maintain,
                  and safer to release.
                </p>
              </div>
            </div>
            <div className="col-span-1">
              <BlogPostArticle article={main_article} parent="blog" />
            </div>
          </div>
        </div>
      </section>
      {archived_articles.length !== 0 && (
        <section className="wsl-min-h-screen-1 bg-dark-blue-900">
          <BlogPostArchive articles={archived_articles} parent="blog" />
        </section>
      )}
    </>
  );
}
