import { test, expect } from '@playwright/test';

import type { Album } from '../src/types/album';
import { isAlbumArray } from '../src/validators/album';
import { expectJsonResponse } from './helpers/expect-json-response';
import { EXISTING_USER_ID, NON_EXISTENT_USER_ID } from './constants';

function assertAlbumArray(value: unknown, route: string): asserts value is Album[] {
  if (!isAlbumArray(value)) {
    throw new Error(`${route}: expected the response body to be an array of valid albums`);
  }
}

test.describe('GET /albums', () => {
  test('returns a valid collection of albums', async ({ request }) => {
    const response = await request.get('/albums');
    const albums = await expectJsonResponse(response);
    assertAlbumArray(albums, 'GET /albums');

    await test.step('Validate collection and album fields', async () => {
      expect(
        albums,
        'GET /albums: expected the collection to contain exactly 100 albums',
      ).toHaveLength(100);

      for (const album of albums) {
        expect(
          album.userId,
          `GET /albums: expected album ${album.id} userId to be a positive integer`,
        )
          .toBeGreaterThan(0);
        expect(
          album.id,
          `GET /albums: expected album ${album.id} ID to be a positive integer`,
        ).toBeGreaterThan(0);
        expect(
          album.title.trim(),
          `GET /albums: expected album ${album.id} title to contain non-whitespace text`,
        )
          .not.toBe('');
      }

      const ids = albums.map((album) => album.id);
      expect(
        new Set(ids).size,
        'GET /albums: expected every album ID to be unique',
      ).toBe(albums.length);
    });
  });
});

test.describe(`GET /users/${EXISTING_USER_ID}/albums`, () => {
  test(`returns valid albums belonging to user ${EXISTING_USER_ID}`, async ({ request }) => {
    const response = await request.get(`/users/${EXISTING_USER_ID}/albums`);
    const albums = await expectJsonResponse(response);
    assertAlbumArray(albums, `GET /users/${EXISTING_USER_ID}/albums`);

    await test.step('Validate album shapes and user association', async () => {
      expect(
        albums.length,
        `GET /users/${EXISTING_USER_ID}/albums: expected the collection to contain at least one album`,
      ).toBeGreaterThan(0);

      for (const album of albums) {
        expect(
          album.userId,
          `GET /users/${EXISTING_USER_ID}/albums: expected album ${album.id} userId to equal ${EXISTING_USER_ID}`,
        ).toBe(EXISTING_USER_ID);
        expect(
          album.id,
          `GET /users/${EXISTING_USER_ID}/albums: expected album ${album.id} ID to be a positive integer`,
        ).toBeGreaterThan(0);
        expect(
          album.title.trim(),
          `GET /users/${EXISTING_USER_ID}/albums: expected album ${album.id} title to contain non-whitespace text`,
        )
          .not.toBe('');
      }
    });
  });
});

test.describe(`GET /users/${NON_EXISTENT_USER_ID}/albums`, () => {
  test('returns an empty array', async ({ request }) => {
    const response = await request.get(`/users/${NON_EXISTENT_USER_ID}/albums`);
    const albums = await expectJsonResponse(response);
    assertAlbumArray(albums, `GET /users/${NON_EXISTENT_USER_ID}/albums`);

    expect(
      albums,
      `GET /users/${NON_EXISTENT_USER_ID}/albums: expected the response body to be an empty array`,
    ).toEqual([]);
  });
});
