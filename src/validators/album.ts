import type { Album } from '../types/album';

export function isAlbum(value: unknown): value is Album {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    !('userId' in value) ||
    !('id' in value) ||
    !('title' in value)
  ) {
    return false;
  }

  return (
    typeof value.userId === 'number' &&
    Number.isInteger(value.userId) &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    typeof value.title === 'string'
  );
}

export function isAlbumArray(value: unknown): value is Album[] {
  return Array.isArray(value) && value.every(isAlbum);
}
