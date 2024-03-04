// // Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import Script from 'next/script';
import { HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi';

import { BlogPostArchive } from '@/components/blog/BlogPostArchive';
import { BlogPostContent } from '@/components/blog/BlogPostContent';
import {
  fetchArticle,
  generateArticlesStaticParams
} from '@/components/utils/blog';

export async function generateStaticParams() {
  return await generateArticlesStaticParams('blog');
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { archived_articles, main_article } = await fetchArticle(
    'blog',
    params.slug
  );
  return (
    <main>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.28.0/themes/prism-okaidia.min.css"
      />
      <section className="bg-white">
        <div className="wsl-min-h-screen-1 container mx-auto max-w-screen-md space-y-8 px-4 py-[10vh]">
          <div>
            {main_article.feature_image && (
              <img
                src={main_article.feature_image}
                alt={main_article.feature_image_alt ?? undefined}
              />
            )}
          </div>
          <div className="mx-auto space-y-4 text-left">
            <span className="font-medium text-sky-600">
              {main_article.primary_tag?.name}
            </span>
            <h3 className="text-4xl font-bold text-dark-blue-900 md:text-5xl">
              {main_article.title}
            </h3>
            <p className="text-gray-500">{main_article.excerpt}</p>
            <figcaption className="flex items-center space-x-4">
              {main_article.primary_author?.profile_image && (
                <img
                  className="h-16 w-16 rounded-2xl"
                  width="64px"
                  height="64px"
                  src={main_article.primary_author.profile_image}
                  alt={main_article.primary_author.name}
                  loading="lazy"
                />
              )}
              <div className="font-medium">
                <div className="text-lg text-dark-blue-800">
                  {main_article.primary_author?.name}
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1 font-medium text-gray-500">
                    <HiOutlineCalendar className="opacity-50" size="1.5rem" />
                    <span className="text-sm">{main_article.published_at}</span>
                  </div>
                  <div className="flex items-center space-x-1 font-medium text-gray-500">
                    <HiOutlineClock className="opacity-50" size="1.5rem" />
                    <span className="text-sm uppercase">
                      {main_article.reading_time} Min
                    </span>
                  </div>
                </div>
              </div>
            </figcaption>
          </div>
          <hr className="border-b-2 border-gray-200" />
          <BlogPostContent article={main_article} />
        </div>
      </section>
      {archived_articles.length !== 0 && (
        <section className="bg-dark-blue-900">
          <BlogPostArchive articles={archived_articles} parent="blog" />
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
    </main>
  );
}
