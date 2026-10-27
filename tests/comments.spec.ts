import { test, expect } from '@playwright/test';

import type { Comment } from '../src/types/comment';
import { isCommentArray } from '../src/validators/comment';
import { expectJsonResponse } from './helpers/expect-json-response';
import { EXISTING_POST_ID, NON_EXISTENT_POST_ID } from './constants';

function assertCommentArray(value: unknown, route: string): asserts value is Comment[] {
  if (!isCommentArray(value)) {
    throw new Error(`${route}: expected the response body to be an array of valid comments`);
  }
}

test.describe('GET /comments', () => {
  test('returns a valid collection of comments', async ({ request }) => {
    const response = await request.get('/comments');
    const comments = await expectJsonResponse(response);
    assertCommentArray(comments, 'GET /comments');

    await test.step('Validate collection and comment fields', async () => {
      expect(
        comments.length,
        'GET /comments: expected the collection to contain at least one comment',
      ).toBeGreaterThan(0);

      for (const comment of comments) {
        expect(
          comment.postId,
          `GET /comments: expected comment ${comment.id} postId to be a positive integer`,
        )
          .toBeGreaterThan(0);
        expect(
          comment.id,
          `GET /comments: expected comment ${comment.id} ID to be a positive integer`,
        ).toBeGreaterThan(0);
        expect(
          comment.name.trim(),
          `GET /comments: expected comment ${comment.id} name to contain non-whitespace text`,
        )
          .not.toBe('');
        expect(
          comment.email.trim(),
          `GET /comments: expected comment ${comment.id} email to contain non-whitespace text`,
        )
          .not.toBe('');
        expect(
          comment.body.trim(),
          `GET /comments: expected comment ${comment.id} body to contain non-whitespace text`,
        )
          .not.toBe('');
      }

      const ids = comments.map((comment) => comment.id);
      expect(
        new Set(ids).size,
        'GET /comments: expected every comment ID to be unique',
      ).toBe(comments.length);
    });
  });
});

test.describe(`GET /posts/${EXISTING_POST_ID}/comments`, () => {
  test(`returns valid comments associated with post ${EXISTING_POST_ID}`, async ({ request }) => {
    const response = await request.get(`/posts/${EXISTING_POST_ID}/comments`);
    const comments = await expectJsonResponse(response);
    assertCommentArray(comments, `GET /posts/${EXISTING_POST_ID}/comments`);

    await test.step(`Validate comments belong to post ${EXISTING_POST_ID}`, async () => {
      expect(
        comments.length,
        `GET /posts/${EXISTING_POST_ID}/comments: expected the collection to contain no more than 5 comments`,
      )
        .toBeLessThanOrEqual(5);

      for (const comment of comments) {
        expect(
          comment.postId,
          `GET /posts/${EXISTING_POST_ID}/comments: expected comment ${comment.id} postId to equal ${EXISTING_POST_ID}`,
        ).toBe(EXISTING_POST_ID);
        expect(
          comment.id,
          `GET /posts/${EXISTING_POST_ID}/comments: expected comment ${comment.id} ID to be a positive integer`,
        ).toBeGreaterThan(0);
        expect(
          comment.name.trim(),
          `GET /posts/${EXISTING_POST_ID}/comments: expected comment ${comment.id} name to contain non-whitespace text`,
        )
          .not.toBe('');
        expect(
          comment.email.trim(),
          `GET /posts/${EXISTING_POST_ID}/comments: expected comment ${comment.id} email to contain non-whitespace text`,
        )
          .not.toBe('');
        expect(
          comment.body.trim(),
          `GET /posts/${EXISTING_POST_ID}/comments: expected comment ${comment.id} body to contain non-whitespace text`,
        )
          .not.toBe('');
      }

      const ids = comments.map((comment) => comment.id);
      expect(
        new Set(ids).size,
        `GET /posts/${EXISTING_POST_ID}/comments: expected every comment ID to be unique`,
      ).toBe(comments.length);
    });
  });
});

test.describe(`GET /posts/${NON_EXISTENT_POST_ID}/comments`, () => {
  test('returns an empty array', async ({ request }) => {
    const response = await request.get(`/posts/${NON_EXISTENT_POST_ID}/comments`);
    const comments = await expectJsonResponse(response);
    assertCommentArray(comments, `GET /posts/${NON_EXISTENT_POST_ID}/comments`);

    expect(
      comments,
      `GET /posts/${NON_EXISTENT_POST_ID}/comments: expected the response body to be an empty array`,
    ).toEqual([]);
  });
});
