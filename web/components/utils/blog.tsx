// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import GhostContentAPI, {
  Params,
  PostOrPage,
  PostsOrPages
} from '@tryghost/content-api';

function makeContentApi() {
  return new GhostContentAPI({
    url: process.env.NEXT_PUBLIC_GHOST_CONTENT_URL || '',
    key: process.env.NEXT_PUBLIC_GHOST_CONTENT_API || '',
    version: 'v5.0',
    makeRequest: async ({ url, method, params, headers }) => {
      const apiUrl = new URL(url);
      Object.entries(params).map(([k, v]) => apiUrl.searchParams.set(k, v));
      const res = await fetch(apiUrl.toString(), { method, headers });
      return { data: await res.json() };
    }
  });
}

function updatePublishDate(v: PostOrPage) {
  if (v.published_at) {
    v.published_at = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(v.published_at));
  }
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

export async function generateArticlesStaticParams(page: 'blog' | 'changelog') {
  const filter = page === 'blog' ? '+tag:-changelog' : '+tag:changelog';
  const posts = await makeContentApi().posts.browse({
    limit: 'all',
    filter: `visibility:-paid${filter}`,
    order: 'published_at DESC'
  });
  return posts.map((v) => ({ slug: v.slug }));
}

export async function fetchArticle(page: 'blog' | 'changelog', slug: string) {
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
    main_article: post,
    archived_articles: (await getArticles(filter))
      .filter((v) => v.id !== post.id)
      .slice(0, 4)
  };
}

export async function fetchArticles(page: 'blog' | 'changelog') {
  const filter = page === 'blog' ? '+tag:-changelog' : '+tag:changelog';
  const posts = await getArticles(filter);
  return {
    archived_articles: posts.slice(1),
    main_article: posts[0]
  };
}
