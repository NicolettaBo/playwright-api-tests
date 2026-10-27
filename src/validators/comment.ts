
import type { Comment } from '../types/comment';

export function isComment(value: unknown): value is Comment {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('postId' in value) ||
    !('id' in value) ||
    !('name' in value) ||
    !('email' in value) ||
    !('body' in value)
  ) {
    return false;
  }

  return (
    typeof value.postId === 'number' &&
    Number.isInteger(value.postId) &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.body === 'string'
  );
}

export function isCommentArray(value: unknown): value is Comment[] {
  return Array.isArray(value) && value.every(isComment);
}
