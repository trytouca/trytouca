// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import GhostContentAPI, {
  Params,
  PostOrPage,
  PostsOrPages
} from '@tryghost/content-api';

export interface BlogPostStaticProps {
  archived_articles: PostOrPage[];
  main_article: PostOrPage;
}

function makeContentApi() {
  return new GhostContentAPI({
    url: process.env.NEXT_PUBLIC_GHOST_CONTENT_URL,
    key: process.env.NEXT_PUBLIC_GHOST_CONTENT_API,
    version: 'v5.0'
  });
}

function updatePublishDate(v: PostOrPage) {
  v.published_at = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(v.published_at));
}

async function getArticles(filter?: string): Promise<PostsOrPages> {
  const posts = await makeContentApi().posts.browse({
    limit: 'all',
    filter: `visibility:-paid${filter}`,
    include: ['tags', 'authors'],
    order: 'published_at DESC'
  });
  posts.forEach(updatePublishDate);
  return posts;
}

export async function getArticleStaticPaths(page: 'blog' | 'changelog') {
  const filter = page === 'blog' ? '+tag:-changelog' : '+tag:changelog';
  const posts = await makeContentApi().posts.browse({
    limit: 'all',
    filter: `visibility:-paid${filter}`,
    order: 'published_at DESC'
  });
  return {
    paths: posts.map((v) => ({ params: { slug: v.slug } })),
    fallback: false
  };
}

export async function getArticleStaticProps(
  page: 'blog' | 'changelog',
  slug: string
) {
  const filter = page === 'blog' ? '+tag:-changelog' : '+tag:changelog';
  const params: Params = {
    limit: 'all',
    filter: `visibility:-paid${filter}`,
    include: ['tags', 'authors'],
    order: 'published_at DESC'
  };
  const post = await makeContentApi().posts.read({ slug }, params);
  updatePublishDate(post);
  return {
    props: {
      main_article: post,
      archived_articles: (await getArticles(filter))
        .filter((v) => v.id !== post.id)
        .slice(0, 4)
    }
  };
}

export async function getArticlesStaticProps(page: 'blog' | 'changelog') {
  const filter = page === 'blog' ? '+tag:-changelog' : '+tag:changelog';
  const posts = await getArticles(filter);
  return {
    props: {
      archived_articles: posts.slice(1),
      main_article: posts[0]
    }
  };
}
