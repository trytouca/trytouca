// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Head from 'next/head';
import React from 'react';

import FooterCta from '@/components/footer-cta';
import {
  Article,
  BlogPostArchive,
  BlogPostArticle,
  getArticles
} from '@/lib/blog';

interface PageContent {
  title: string;
  subtitle: string;
  featured: string;
}

const content: PageContent = {
  title: 'The Touca Times',
  subtitle:
    'Notes on our journey towards making software easier to maintain and safer to release.',
  featured: 'launch-vision'
};

type StaticProps = {
  archived_articles: Article[];
  main_article: Article;
};

export default function BlogPage(props: StaticProps) {
  return (
    <>
      <Head>
        <title>Touca Blog</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <section className="bg-gradient-to-b from-dark-blue-900 to-dark-blue-800">
        <div className="container flex flex-col justify-center mx-auto wsl-min-h-screen-1">
          <div className="grid grid-cols-1 gap-4 p-8 space-y-8 lg:grid-cols-2 lg:space-y-0">
            <div className="grid col-span-1 place-content-center">
              <div className="max-w-lg space-y-4 text-white">
                <h3 className="text-4xl font-bold lg:text-5xl">
                  {content.title}
                </h3>
                <p className="text-xl font-light lg:text-2xl text-sky-200">
                  {content.subtitle}
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
      <section className="py-8 min-h-[25vh] flex items-center bg-dark-blue-800">
        <div className="container px-8 mx-auto md:px-24 lg:px-8">
          <FooterCta></FooterCta>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps() {
  const articles = getArticles();
  const main_article = articles.find((v) => v.slug === content.featured);
  const archived_articles = articles.filter((v) => v.slug !== content.featured);
  return {
    props: {
      archived_articles,
      main_article
    }
  };
}
