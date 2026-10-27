
import { test, expect } from '@playwright/test';

import type { Post } from '../src/types/post';
import { isPost, isPostArray } from '../src/validators/post';
import { expectJsonResponse } from './helpers/expect-json-response';
import {
  EXISTING_POST_ID,
  EXISTING_USER_ID,
  NON_EXISTENT_POST_ID,
  NON_EXISTENT_USER_ID,
} from './constants';

function assertPost(value: unknown, route: string): asserts value is Post {
  if (!isPost(value)) {
    throw new Error(`${route}: expected the response body to match the Post schema`);
  }
}

function assertPostArray(value: unknown, route: string): asserts value is Post[] {
  if (!isPostArray(value)) {
    throw new Error(`${route}: expected the response body to be an array of valid posts`);
  }
}

const existingPostIds = [
  { id: EXISTING_POST_ID, position: 'first' },
  { id: 50, position: 'middle' },
  { id: 100, position: 'last expected' },
];

test.describe('GET /posts/:id', () => {
  for (const { id, position } of existingPostIds) {
    test(`returns the ${position} post for ID ${id}`, async ({ request }) => {
      const response = await request.get(`/posts/${id}`);
      const post = await expectJsonResponse(response);

      assertPost(post, `GET /posts/${id}`);
      expect(
        post.id,
        `GET /posts/${id}: expected the returned post ID to equal ${id}`,
      ).toBe(id);
    });
  }
});

test.describe('GET /posts', () => {
  test('returns a valid collection of posts', async ({ request }) => {
    const response = await request.get('/posts');
    const posts = await expectJsonResponse(response);

    assertPostArray(posts, 'GET /posts');

    await test.step('Validate collection size and post fields', async () => {
      expect(
        posts,
        'GET /posts: expected the collection to contain exactly 100 posts',
      ).toHaveLength(100);
      for (const post of posts) {
        expect(
          post.userId,
          `GET /posts: expected post ${post.id} userId to be a positive integer`,
        ).toBeGreaterThan(0);
        expect(
          post.id,
          `GET /posts: expected post ${post.id} ID to be a positive integer`,
        ).toBeGreaterThan(0);
        expect(
          post.title.trim().length,
          `GET /posts: expected post ${post.id} title to contain non-whitespace text`,
        ).toBeGreaterThan(0);
        expect(
          post.body.trim().length,
          `GET /posts: expected post ${post.id} body to contain non-whitespace text`,
        ).toBeGreaterThan(0);
      }
      const ids = posts.map((post) => post.id);
      expect(
        new Set(ids).size,
        'GET /posts: expected every post ID to be unique',
      ).toBe(posts.length);
    });
  });
});

test.describe(`GET /posts/${NON_EXISTENT_POST_ID}`, () => {
  test('returns 404 and an empty object', async ({ request }) => {
    const response = await request.get(`/posts/${NON_EXISTENT_POST_ID}`);

    await test.step('Validate not-found response', async () => {
      expect(
        response.status(),
        `GET /posts/${NON_EXISTENT_POST_ID}: expected the response status to be HTTP 404 Not Found`,
      ).toBe(404);

      const post: unknown = await response.json();
      expect(
        post,
        `GET /posts/${NON_EXISTENT_POST_ID}: expected the response body to be an empty object`,
      ).toEqual({});
    });
  });
});

test.describe('POST /posts', () => {
  test('creates a post and returns its data with an assigned ID', async ({ request }) => {
    const newPost = {
      userId: EXISTING_USER_ID,
      title: 'Automated API test post',
      body: 'This post was submitted by a Playwright API test.',
    };

    const response = await request.post('/posts', {
      data: newPost,
    });
    const createdPost = await expectJsonResponse(response, 201);
    assertPost(createdPost, 'POST /posts');
    await test.step('Validate created post fields', async () => {
      expect(
        createdPost.userId,
        `POST /posts: expected the created post userId to equal the submitted userId (${newPost.userId})`,
      ).toBe(newPost.userId);
      expect(
        createdPost.title,
        `POST /posts: expected the created post title to equal "${newPost.title}"`,
      ).toBe(newPost.title);
      expect(
        createdPost.body,
        `POST /posts: expected the created post body to equal "${newPost.body}"`,
      ).toBe(newPost.body);
      expect(
        createdPost.id,
        'POST /posts: expected the created post ID to be a positive integer',
      ).toBeGreaterThan(0);
    });
  });

  test('accepts a post with a nonexistent userId', async ({ request }) => {
    const newPost = {
      userId: NON_EXISTENT_USER_ID,
      title: 'Post with nonexistent user',
      body: 'This post references a user that does not exist.',
    };

    const response = await request.post('/posts', {
      data: newPost,
    });
    const createdPost = await expectJsonResponse(response, 201);

    assertPost(createdPost, 'POST /posts');
    await test.step('Validate returned post fields', async () => {
      expect(
        createdPost.userId,
        `POST /posts: expected the returned userId to equal ${NON_EXISTENT_USER_ID}`,
      ).toBe(NON_EXISTENT_USER_ID);
      expect(
        createdPost.title,
        `POST /posts: expected the returned title to equal "${newPost.title}"`,
      ).toBe(newPost.title);
      expect(
        createdPost.body,
        `POST /posts: expected the returned body to equal "${newPost.body}"`,
      ).toBe(newPost.body);
      expect(
        createdPost.id,
        'POST /posts: expected the returned ID to be a positive integer',
      ).toBeGreaterThan(0);
    });
  });
});

test.describe('POST /posts title edge cases', () => {
  const titleCases = [
    { description: 'an empty title', title: '' },
    { description: 'a whitespace-only title', title: '   \t  ' },
    {
      description: 'a title with special characters',
      title: 'Post: "quoted" / #tag & more!',
    },
    { description: 'a title with Unicode characters', title: 'Café — 東京 🌿' },
    { description: 'a title with a line break', title: 'First line\nSecond line' },
  ];

  for (const { description, title } of titleCases) {
    test(`accepts ${description} and echoes it in the response`, async ({ request }) => {
      const newPost = {
        userId: EXISTING_USER_ID,
        title,
        body: 'Testing POST /posts title input handling.',
      };

      const response = await request.post('/posts', {
        data: newPost,
      });
      const createdPost = await expectJsonResponse(response, 201);

      assertPost(createdPost, 'POST /posts');
      expect(
        createdPost.userId,
        `POST /posts: expected the returned userId to equal the submitted userId (${newPost.userId})`,
      ).toBe(newPost.userId);
      expect(
        createdPost.title,
        `POST /posts: expected the returned title to equal ${JSON.stringify(newPost.title)}`,
      ).toBe(newPost.title);
      expect(
        createdPost.body,
        `POST /posts: expected the returned body to equal ${JSON.stringify(newPost.body)}`,
      ).toBe(newPost.body);
      expect(
        createdPost.id,
        'POST /posts: expected the returned ID to be a positive integer',
      ).toBeGreaterThan(0);
    });
  }
});

test.describe(`PUT /posts/${EXISTING_POST_ID}`, () => {
  test('replaces a post and returns the submitted data', async ({ request }) => {
    const updatedPost = {
      userId: 2,
      id: EXISTING_POST_ID,
      title: 'Updated post title using PUT',
      body: 'This is the replacement post body.',
    };

    const response = await request.put(`/posts/${EXISTING_POST_ID}`, {
      data: updatedPost,
    });
    const post = await expectJsonResponse(response);
    assertPost(post, `PUT /posts/${EXISTING_POST_ID}`);
    await test.step('Validate returned post fields', async () => {
      expect(
        post.id,
        `PUT /posts/${EXISTING_POST_ID}: expected the returned post ID to equal ${EXISTING_POST_ID}`,
      ).toBe(EXISTING_POST_ID);
      expect(
        post.userId,
        `PUT /posts/${EXISTING_POST_ID}: expected the returned userId to equal the submitted userId (${updatedPost.userId})`,
      )
        .toBe(updatedPost.userId);
      expect(
        post.title,
        `PUT /posts/${EXISTING_POST_ID}: expected the returned title to equal "${updatedPost.title}"`,
      )
        .toBe(updatedPost.title);
      expect(
        post.body,
        `PUT /posts/${EXISTING_POST_ID}: expected the returned body to equal "${updatedPost.body}"`,
      )
        .toBe(updatedPost.body);
    });
  });
});

test.describe(`PATCH /posts/${EXISTING_POST_ID}`, () => {
  test('updates the title and returns a valid post', async ({ request }) => {
    const patchData = {
      title: 'Patched post title',
    };

    const response = await request.patch(`/posts/${EXISTING_POST_ID}`, {
      data: patchData,
    });
    const post = await expectJsonResponse(response);
    assertPost(post, `PATCH /posts/${EXISTING_POST_ID}`);
    await test.step('Validate patched post fields', async () => {
      expect(
        post.id,
        `PATCH /posts/${EXISTING_POST_ID}: expected the returned post ID to equal ${EXISTING_POST_ID}`,
      ).toBe(EXISTING_POST_ID);
      expect(
        post.title,
        `PATCH /posts/${EXISTING_POST_ID}: expected the returned title to equal "${patchData.title}"`,
      ).toBe(patchData.title);
      expect(
        post.userId,
        `PATCH /posts/${EXISTING_POST_ID}: expected the returned userId to be a positive integer`,
      ).toBeGreaterThan(0);
      expect(
        post.body.trim().length,
        `PATCH /posts/${EXISTING_POST_ID}: expected the returned body to contain non-whitespace text`,
      ).toBeGreaterThan(0);
    });
  });
});

test.describe(`DELETE /posts/${EXISTING_POST_ID}`, () => {
  test('returns a successful response and an empty object', async ({ request }) => {
    const response = await request.delete(`/posts/${EXISTING_POST_ID}`);
    const responseBody = await expectJsonResponse(response);

    await test.step('Validate response body', async () => {
      expect(
        responseBody,
        `DELETE /posts/${EXISTING_POST_ID}: expected the response body to be an empty JSON object`,
      ).toEqual({});
    });
  });
});
