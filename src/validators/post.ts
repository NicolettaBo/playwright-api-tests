import type { Post } from '../types/post';

export function isPost(value: unknown): value is Post {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('userId' in value) ||
    !('id' in value) ||
    !('title' in value) ||
    !('body' in value)
  ) {
    return false;
  }

  return (
    typeof value.userId === 'number' &&
    Number.isInteger(value.userId) &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    typeof value.title === 'string' &&
    typeof value.body === 'string'
  );
}

export function isPostArray(value: unknown): value is Post[] {
  return Array.isArray(value) && value.every(isPost);
}
