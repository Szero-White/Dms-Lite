import type { PageResponse } from '../types';

const ALL_PAGES_FETCH_SIZE = 100;

/**
 * Loads a complete collection through the server's bounded paging API.
 *
 * This is intentionally used only by current screens that perform local
 * cross-record filtering/aggregation. It avoids silently truncating those
 * screens to page 0 while keeping each HTTP response bounded. Large-data
 * workspaces should continue to use server-side filtering and pagination.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>,
): Promise<T[]> {
  const allItems: T[] = [];
  let pageNumber = 0;

  while (true) {
    const page = await fetchPage(pageNumber, ALL_PAGES_FETCH_SIZE);
    allItems.push(...page.content);

    if (page.number + 1 >= page.totalPages || page.content.length === 0) {
      return allItems;
    }

    pageNumber = page.number + 1;
  }
}
