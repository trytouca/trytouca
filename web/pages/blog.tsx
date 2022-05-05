// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { BreadcrumbJsonLd, NextSeo } from 'next-seo';
import React from 'react';

import { BlogPostArchive, BlogPostArticle } from '@/components/blog';
import Header from '@/components/header';
import { BlogPostStaticProps, getBlogPostsStaticProps } from '@/lib/blog';

export default function BlogPage(props: BlogPostStaticProps) {
  return (
    <>
      <BreadcrumbJsonLd
        itemListElements={[{ position: 1, name: 'Touca Blog' }]}
      />
      <NextSeo title="Blog" canonical="https://touca.io/blog" />
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
          <BlogPostArchive articles={props.archived_articles}></BlogPostArchive>
        </section>
      )}
    </>
  );
}

export async function getStaticProps() {
  return getBlogPostsStaticProps();
}
