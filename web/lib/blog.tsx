// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { format, parseISO } from 'date-fns';
import fs from 'fs';
import matter from 'gray-matter';
import Link from 'next/link';
import { join } from 'path';
import React from 'react';
import {
  HiArrowNarrowRight,
  HiOutlineCalendar,
  HiOutlineClock
} from 'react-icons/hi';

export interface Article {
  authorName: string;
  authorPhoto: string;
  content?: string;
  excerpt?: string;
  hidden: boolean;
  publishDate: string;
  readTime: number;
  slug: string;
  title: string;
}

export function getArticles(): Article[] {
  const directory = join(process.cwd(), '_posts');
  const filenames = fs.readdirSync(directory);
  const articles = filenames
    .map((v) => {
      const slug = v.replace(/\.md$/, '');
      const filepath = join(directory, `${slug}.md`);
      const fileContents = fs.readFileSync(filepath, 'utf8');
      const { data } = matter(fileContents);
      return { ...data, slug } as Article;
    })
    .filter((v) => v.hidden === false)
    .sort((a, b) =>
      new Date(a.publishDate) < new Date(b.publishDate) ? -1 : 1
    );
  articles.forEach(
    (v) => (v.publishDate = format(parseISO(v.publishDate), 'LLLL d, yyyy'))
  );
  return articles;
}

export function getArticle(slug: string): Article {
  const filepath = join(process.cwd(), '_posts', `${slug}.md`);
  const fileContents = fs.readFileSync(filepath, 'utf8');
  const { content, data } = matter(fileContents);
  const article = { ...data, content, slug } as Article;
  article.publishDate = format(parseISO(article.publishDate), 'LLLL d, yyyy');
  return article;
}

export class BlogPostArticle extends React.Component<
  { article: Article; featured: boolean },
  Record<string, never>
> {
  render() {
    const articleLink = '/blog/' + this.props.article.slug;
    return (
      <div className="flex w-full flex-col justify-between space-y-4 rounded-lg bg-dark-blue-800 p-8 shadow-xl">
        {this.props.featured && (
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-dark-blue-700 bg-opacity-25 px-4 py-2 font-medium text-gray-300">
              Featured Blog Post
            </div>
          </div>
        )}
        <div className="space-y-4">
          <Link href={articleLink}>
            <a title="Read this article">
              <h4 className="text-3xl font-medium text-white">
                {this.props.article.title}
              </h4>
            </a>
          </Link>
        </div>
        {this.props.article.excerpt && (
          <blockquote className="text-xl text-gray-300">
            <p>{this.props.article.excerpt}</p>
          </blockquote>
        )}
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1 font-medium text-gray-300">
              <HiOutlineCalendar className="opacity-50" size="1.5rem" />
              <span>{this.props.article.publishDate}</span>
            </div>
            <div className="flex items-center space-x-1 font-medium text-gray-300">
              <HiOutlineClock className="opacity-50" size="1.5rem" />
              <span className="uppercase">
                {this.props.article.readTime} Min
              </span>
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
    );
  }
}

export class BlogPostArchive extends React.Component<
  { articles: Article[] },
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
