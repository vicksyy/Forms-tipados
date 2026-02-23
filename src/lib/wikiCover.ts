import type { Platform } from '../types';

interface WikiThumbnail {
  source: string;
}

interface WikiPage {
  thumbnail?: WikiThumbnail;
}

interface WikiQuery {
  pages: Record<string, WikiPage>;
}

interface WikiSearchResponse {
  query?: WikiQuery;
}

function buildSearchQuery(title: string, platform: Platform): string {
  return `${title} ${platform} video game cover`;
}

export async function fetchWikipediaCover(title: string, platform: Platform): Promise<string> {
  const searchQuery = buildSearchQuery(title, platform);
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: searchQuery,
    gsrlimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '480'
  });

  const endpoint = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return '';
    }

    const data: WikiSearchResponse = await response.json();
    const pages = data.query?.pages;
    if (pages === undefined) {
      return '';
    }

    const firstPage = Object.values(pages)[0];
    if (firstPage === undefined || firstPage.thumbnail === undefined) {
      return '';
    }

    return firstPage.thumbnail.source;
  } catch {
    return '';
  }
}
