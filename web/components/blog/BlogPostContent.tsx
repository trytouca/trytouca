// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
'use client';

import { PostOrPage } from '@tryghost/content-api';
import React from 'react';

export function BlogPostContent({ article }: { article: PostOrPage }) {
  return !article.html ? null : (
    <>
      <article
        className="prose mx-auto lg:prose-lg"
        dangerouslySetInnerHTML={{ __html: article.html }}
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
