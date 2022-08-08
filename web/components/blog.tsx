// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { PostOrPage } from '@tryghost/content-api';
import Link from 'next/link';
import React from 'react';
import { HiArrowNarrowRight, HiOutlineCalendar } from 'react-icons/hi';

export class BlogPostArticle extends React.Component<
  { article: PostOrPage; featured: boolean },
  Record<string, never>
> {
  render() {
    const articleLink = '/blog/' + this.props.article.slug;
    return (
      <div className="flex w-full flex-col justify-between space-y-4 rounded-lg bg-dark-blue-800 shadow-xl">
        <img
          className="w-full"
          src={this.props.article.feature_image}
          alt={this.props.article.feature_image_alt}></img>
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
                    <HiArrowNarrowRight className="inline h-6 opacity-50 group-hover:opacity-100"></HiArrowNarrowRight>
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

export class BlogPostArchive extends React.Component<
  { articles: PostOrPage[] },
  Record<string, never>
> {
  render() {
    return (
      <>
        <div className="container mx-auto px-4 py-32 lg:px-8">
          <h2 className="pb-16 text-4xl font-bold text-white">
            Other Articles
          </h2>
          <div className="grid gap-8 lg:grid-cols-2 xl:gap-16">
            {this.props.articles.map((article, index) => {
              return (
                <div key={index} className="flex grid-cols-1 items-stretch">
                  <BlogPostArticle article={article} featured={false} />
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }
}

export function BlogPostContent(props: { article: PostOrPage }) {
  return (
    <>
      <article
        className="prose mx-auto lg:prose-lg"
        dangerouslySetInnerHTML={{ __html: props.article.html }}
      />
      <style jsx global>
        {`
          .kg-bookmark-content {
            display: none;
          }
          .kg-callout-card {
            display: flex;
            border-radius: 0.25rem;
            padding: 1rem;
          }
          .kg-callout-card-grey {
            background-color: lightgray;
          }
          .kg-card.kg-embed-card > iframe {
            width: 100%;
            height: auto;
            aspect-ratio: 16 / 9;
          }
        `}
      </style>
    </>
  );
}
