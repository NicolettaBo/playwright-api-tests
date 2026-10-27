import { expect, type APIResponse } from '@playwright/test';

export async function expectJsonResponse(
  response: APIResponse,
  expectedStatus = 200,
): Promise<unknown> {
  expect(response.status(), `Expected HTTP ${expectedStatus}`).toBe(expectedStatus);
  expect(
    response.headers()['content-type'],
    'Expected response content-type to include application/json',
  ).toContain('application/json');

  return response.json();
}
