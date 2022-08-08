// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { PostOrPage } from '@tryghost/content-api';
import Link from 'next/link';
import { BreadcrumbJsonLd, NextSeo } from 'next-seo';
import React from 'react';
import { HiArrowNarrowRight, HiOutlineCalendar } from 'react-icons/hi';

import { BlogPostArticle } from '@/components/blog';
import Header from '@/components/header';
import { BlogPostStaticProps, getArticlesStaticProps } from '@/lib/blog';

export default function ChangelogPage(props: BlogPostStaticProps) {
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca Changelog' }]}
      />
      <NextSeo title="Changelog" canonical="https://touca.io/changelog" />
      <Header></Header>
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
              <BlogPostArticle
                article={props.main_article}
                featured={true}></BlogPostArticle>
            </div>
          </div>
        </div>
      </section>
      {props.archived_articles.length !== 0 && (
        <section className="wsl-min-h-screen-1 bg-dark-blue-900">
          <ChangelogListItem articles={props.archived_articles} />
        </section>
      )}
    </>
  );
}

export class ChangelogListItem extends React.Component<
  { articles: PostOrPage[] },
  Record<string, never>
> {
  render() {
    return (
      <>
        <div className="container mx-auto px-4 py-32 lg:px-8">
          <h2 className="pb-16 text-4xl font-bold text-white">
            Previous Updates
          </h2>
          <div className="grid gap-8 xl:gap-16">
            {this.props.articles.map((article, index) => {
              return (
                <div key={index} className="flex items-stretch">
                  <ChangelogPost article={article} featured={false} />
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }
}

class ChangelogPost extends React.Component<
  { article: PostOrPage; featured: boolean },
  Record<string, never>
> {
  render() {
    const articleLink = '/changelog/' + this.props.article.slug;
    return (
      <div className="flex w-full flex-col justify-between space-y-4 rounded-lg bg-dark-blue-800 shadow-xl">
        <div className="space-y-4 px-8 py-4">
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-yellow-500">
              {this.props.article.tags[0].name}
            </h5>
            <Link href={articleLink}>
              <a className="block" title="Read this article">
                <h4 className="text-3xl font-medium text-white">
                  {this.props.article.title}
                </h4>
              </a>
            </Link>
          </div>
          {this.props.article.excerpt && (
            <blockquote className="text-lg text-gray-300">
              <p>{this.props.article.excerpt}</p>
            </blockquote>
          )}
          <div className="flex justify-between">
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1 font-medium text-gray-300">
                <HiOutlineCalendar className="opacity-50" size="1.5rem" />
                <span>{this.props.article.published_at}</span>
              </div>
            </div>
            <div className="flex items-center">
              <Link href={articleLink}>
                <a title="Read this article">
                  <button
                    className="group space-x-1 rounded-full bg-dark-blue-700 bg-opacity-25 px-4 py-2 text-gray-300 hover:text-white focus:underline focus:outline-none"
                    type="button"
                    role="button">
                    <span className="text-sm font-medium leading-6">
                      Read Article
                    </span>
                    <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100" />
                  </button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export async function getStaticProps() {
  return getArticlesStaticProps('changelog');
}
