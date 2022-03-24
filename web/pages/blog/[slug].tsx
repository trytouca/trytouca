// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { PostOrPage } from '@tryghost/content-api';
import Head from 'next/head';
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';

import Header from '@/components/header';
import { BlogPostArchive, getArticles } from '@/lib/blog';

type StaticProps = {
  main_article: PostOrPage;
  archived_articles: PostOrPage[];
};

export default function BlogPage(props: StaticProps) {
  return (
    <>
      <Head>
        <title>Touca Blog - {props.main_article.title}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <Header></Header>
      <section className="bg-white">
        <div className="wsl-min-h-screen-1 container mx-auto max-w-screen-md space-y-8 py-[10vh] px-4">
          <div>
            <img
              src={props.main_article.feature_image}
              alt={props.main_article.feature_image_alt}
            />
          </div>
          <div className="mx-auto space-y-4 text-left">
            <span className="font-medium text-sky-600">
              {props.main_article.primary_tag.name}
            </span>
            <h3 className="text-4xl font-bold text-dark-blue-900 md:text-5xl">
              {props.main_article.title}
            </h3>
            <p className="text-gray-500">{props.main_article.excerpt}</p>
            <figcaption className="flex items-center space-x-4">
              <img
                className="h-16 w-16 rounded-2xl"
                width="64px"
                height="64px"
                src={props.main_article.primary_author.profile_image}
                alt={props.main_article.primary_author.name}
                loading="lazy"
              />
              <div className="font-medium">
                <div className="text-lg text-dark-blue-800">
                  {props.main_article.primary_author.name}
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1 font-medium text-gray-500">
                    <HiOutlineCalendar className="opacity-50" size="1.5rem" />
                    <span className="text-sm">
                      {props.main_article.published_at}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 font-medium text-gray-500">
                    <HiOutlineClock className="opacity-50" size="1.5rem" />
                    <span className="text-sm uppercase">
                      {props.main_article.reading_time} Min
                    </span>
                  </div>
                </div>
              </div>
            </figcaption>
          </div>
          <hr className="border-b-2 border-gray-200" />
          <article
            className="prose mx-auto lg:prose-lg"
            dangerouslySetInnerHTML={{ __html: props.main_article.html }}
          />
        </div>
      </section>
      {props.archived_articles.length !== 0 && (
        <section className="bg-dark-blue-900">
          <BlogPostArchive articles={props.archived_articles}></BlogPostArchive>
        </section>
      )}
    </>
  );
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const articles = await getArticles();
  return {
    props: {
      main_article: articles.filter((v) => v.slug === params.slug)[0],
      archived_articles: articles.filter((v) => v.slug !== params.slug)
    }
  };
}

export async function getStaticPaths() {
  const articles = await getArticles();
  return {
    paths: articles.map((v) => ({ params: { slug: v.slug } })),
    fallback: false
  };
}
