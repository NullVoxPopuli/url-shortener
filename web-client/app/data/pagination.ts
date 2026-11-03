import type { ReactiveDocument } from '@warp-drive/core/reactive';

/**
 * Where a page sits in its collection, from the api's `meta.page`.
 */
export function pageOf(document: ReactiveDocument<unknown>) {
  const page = (document.meta as { page?: { number?: number; lastPage?: number } } | undefined)
    ?.page;

  return {
    currentPage: page?.number ?? 1,
    totalPages: page?.lastPage ?? 1,
  };
}
