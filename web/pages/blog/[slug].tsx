// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import Script from 'next/script';
import { ArticleJsonLd, BreadcrumbJsonLd, NextSeo } from 'next-seo';
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';

import { BlogPostArchive, BlogPostContent } from '@/components/blog';
import Header from '@/components/header';
import {
  BlogPostStaticProps,
  getArticleStaticPaths,
  getArticleStaticProps
} from '@/lib/blog';

export default function BlogPage(props: BlogPostStaticProps) {
  return (
    <>
      <NextSeo
        title={props.main_article.title}
        canonical={'https://touca.io/blog/' + props.main_article.slug}
        description={
          props.main_article.og_description ?? props.main_article.excerpt
        }
        openGraph={{
          url: 'https://touca.io/blog/' + props.main_article.slug,
          title: props.main_article.og_title ?? props.main_article.title,
          description:
            props.main_article.og_description ?? props.main_article.excerpt,
          images: [
            {
              url:
                props.main_article.og_image ?? props.main_article.feature_image,
              width: 1200,
              height: 675,
              alt: props.main_article.feature_image_alt
            }
          ]
        }}
      />
      <BreadcrumbJsonLd
        itemListElements={[
          { position: 1, name: 'Touca Blog', item: 'https://touca.io/blog' },
          { position: 2, name: props.main_article.title }
        ]}
      />
      <ArticleJsonLd
        type="Blog"
        url={'https://touca.io/blog/' + props.main_article.slug}
        title={props.main_article.title}
        images={[props.main_article.feature_image]}
        datePublished={props.main_article.published_at}
        dateModified={props.main_article.updated_at}
        authorName={props.main_article.primary_author.name}
        description={props.main_article.excerpt}
      />
      <Head>
        <title>{`Touca Blog - ${props.main_article.title}`}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <Header></Header>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/themes/prism-okaidia.min.css"
      />
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
          <BlogPostContent article={props.main_article} />
        </div>
      </section>
      {props.archived_articles.length !== 0 && (
        <section className="bg-dark-blue-900">
          <BlogPostArchive articles={props.archived_articles} parent="blog" />
        </section>
      )}
      <Script
        strategy="afterInteractive"
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/components/prism-core.min.js"
      />
      <Script
        strategy="afterInteractive"
        src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/plugins/autoloader/prism-autoloader.min.js"
      />
    </>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return await getArticleStaticProps('blog', context.params.slug as string);
}

export async function getStaticPaths() {
  return await getArticleStaticPaths('blog');
}
