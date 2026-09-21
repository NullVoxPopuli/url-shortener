import type { ReactiveDocument } from '@warp-drive/core/reactive';

/**
 * Where a page sits in its collection. The api reports it as
 * `meta.page`, which is not the shape WarpDrive reads by default.
 *
 * One function for the whole app: pages of a collection share a
 * cache, and every <Paginate> for it must pass the same reference.
 */
export function pageHints(document: ReactiveDocument<unknown>) {
  const page = (document.meta as { page?: { number?: number; lastPage?: number } } | undefined)
    ?.page;

  return {
    currentPage: page?.number ?? 1,
    totalPages: page?.lastPage ?? 1,
  };
}
