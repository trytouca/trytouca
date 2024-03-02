// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { PostOrPage } from '@tryghost/content-api';
import { Metadata } from 'next';
import Link from 'next/link';
import { HiArrowNarrowRight, HiOutlineCalendar } from 'react-icons/hi';

import { BlogPostArticle } from '@/components/blog/BlogPostArticle';
import { fetchArticles } from '@/components/utils/blog';

export const metadata: Metadata = {
  title: 'Changelog',
  alternates: { canonical: '/changelog' }
};

export default async function Page() {
  const { archived_articles, main_article } = await fetchArticles('changelog');
  return (
    <>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center">
          <div className="grid grid-cols-1 gap-4 space-y-8 p-8 lg:grid-cols-2 lg:space-y-0">
            <div className="col-span-1 grid place-content-center">
              <div className="max-w-lg space-y-4 text-white">
                <h3 className="text-4xl font-bold lg:text-5xl">
                  Touca Changelog
                </h3>
                <p className="text-xl font-light text-white lg:text-2xl">
                  Weekly product updates, summarizing the new features,
                  improvements, and bugfixes
                </p>
              </div>
            </div>
            <div className="col-span-1">
              <BlogPostArticle article={main_article} parent="changelog" />
            </div>
          </div>
        </div>
      </section>
      {archived_articles.length !== 0 && (
        <section className="wsl-min-h-screen-1 bg-dark-blue-900">
          <ChangelogListItem articles={archived_articles} />
        </section>
      )}
    </>
  );
}

function ChangelogListItem({ articles }: { articles: PostOrPage[] }) {
  return (
    <div className="container mx-auto px-4 py-32 lg:px-8">
      <h2 className="pb-16 text-4xl font-bold text-white">Previous Updates</h2>
      <div className="grid gap-8 xl:gap-16">
        {articles.map((article, index) => {
          return (
            <div key={index} className="flex items-stretch">
              <ChangelogPost article={article} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChangelogPost({ article }: { article: PostOrPage }) {
  const articleLink = '/changelog/' + article.slug;

  return (
    <div className="flex w-full flex-col justify-between space-y-4 rounded-lg bg-dark-blue-800 shadow-xl">
      <div className="space-y-4 px-8 py-4">
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-yellow-500">
            {article.tags?.[0].name}
          </h5>
          <Link href={articleLink} className="block" title="Read this article">
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
