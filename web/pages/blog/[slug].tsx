// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import Head from 'next/head';
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

import Header from '@/components/header';
import { Article, BlogPostArchive, getArticle, getArticles } from '@/lib/blog';

type StaticProps = {
  archived_articles: Article[];
  main_article: Article;
};

type Params = {
  params: {
    slug: string;
  };
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
        <div className="min-h-[15vh]"></div>
        <div className="wsl-min-h-screen-1 container mx-auto flex flex-col justify-center space-y-8 p-16">
          <div className="mx-auto space-y-8">
            <h3 className="max-w-4xl text-5xl font-bold text-dark-blue-900">
              {props.main_article.title}
            </h3>
            <figcaption className="flex items-center space-x-4">
              <img
                className="h-16 w-16 rounded-2xl"
                width="64px"
                height="64px"
                src={props.main_article.authorPhoto}
                alt={props.main_article.authorName}
                loading="lazy"
              />
              <div className="font-medium">
                <div className="text-lg text-dark-blue-800">
                  {props.main_article.authorName}
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1 font-medium text-gray-600">
                    <HiOutlineCalendar className="opacity-50" size="1.5rem" />
                    <span className="text-sm">
                      {props.main_article.publishDate}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 font-medium text-gray-600">
                    <HiOutlineClock className="opacity-50" size="1.5rem" />
                    <span className="text-sm uppercase">
                      {props.main_article.readTime} Min
                    </span>
                  </div>
                </div>
              </div>
            </figcaption>
          </div>
          <article
            className="prose mx-auto lg:prose-xl"
            dangerouslySetInnerHTML={{ __html: props.main_article.content }}
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

export async function getStaticProps({ params }: Params) {
  const archived_articles = getArticles().filter((v) => v.slug !== params.slug);
  const main_article = getArticle(params.slug);
  const result = await remark()
    .use(remarkHtml)
    .process(main_article.content || '');
  main_article.content = result.toString();
  return {
    props: {
      main_article,
      archived_articles
    }
  };
}

export async function getStaticPaths() {
  return {
    paths: getArticles().map((v) => ({ params: { slug: v.slug } })),
    fallback: false
  };
}
