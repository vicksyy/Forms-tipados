import type { Platform } from '../types';

interface WikiThumbnail {
  source: string;
}

interface WikiPage {
  pageid?: number;
  title?: string;
  thumbnail?: WikiThumbnail;
  categories?: Array<{ title?: string }>;
}

interface WikiQuery {
  pages: Record<string, WikiPage>;
}

interface WikiSearchResponse {
  query?: WikiQuery;
}

export interface WikiCoverOption {
  id: number;
  title: string;
  thumbnailUrl: string;
}

function buildSearchQuery(title: string, platform: Platform): string {
  return `${title} ${platform} video game`;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripParentheses(value: string): string {
  return value.replace(/\s*\([^)]*\)/g, '').trim();
}

function getPlatformKeywords(platform: Platform): string[] {
  switch (platform) {
    case 'PS1':
      return ['playstation games', 'playstation 1 games', 'ps1'];
    case 'PS2':
      return ['playstation 2 games', 'ps2'];
    case 'PS3':
      return ['playstation 3 games', 'ps3'];
    case 'PS4':
      return ['playstation 4 games', 'ps4'];
    case 'PS5':
      return ['playstation 5 games', 'ps5'];
    case 'Nintendo':
      return [
        'nintendo games',
        'nintendo switch games',
        'wii games',
        'wii u games',
        'gamecube games',
        'nintendo ds games',
        'nintendo 3ds games'
      ];
    case 'PC':
      return ['windows games', 'pc games', 'linux games', 'macos games', 'steam'];
    default:
      return [];
  }
}

function scorePage(page: WikiPage, title: string, platform: Platform): number {
  const rawPageTitle = page.title ?? '';
  const pageTitle = normalizeText(stripParentheses(rawPageTitle));
  const inputTitle = normalizeText(title);
  const categoryText = (page.categories ?? [])
    .map((category) => normalizeText(category.title ?? ''))
    .join(' ');
  const platformKeywords = getPlatformKeywords(platform);

  let score = 0;
  if (pageTitle === inputTitle) {
    score += 100;
  } else if (pageTitle.startsWith(inputTitle)) {
    score += 70;
  } else if (pageTitle.includes(inputTitle)) {
    score += 45;
  }

  if (categoryText.includes('video games')) {
    score += 25;
  }

  if (platformKeywords.some((keyword) => categoryText.includes(keyword))) {
    score += 25;
  }

  if (page.thumbnail !== undefined) {
    score += 10;
  }

  return score;
}

function isVideoGamePage(page: WikiPage): boolean {
  const categoryText = (page.categories ?? [])
    .map((category) => normalizeText(category.title ?? ''))
    .join(' ');

  return categoryText.includes('video games');
}

export async function fetchWikipediaCover(title: string, platform: Platform): Promise<string> {
  const coverOptions = await fetchWikipediaCoverOptions(title, platform, 1);
  if (coverOptions.length === 0) {
    return '';
  }

  return coverOptions[0].thumbnailUrl;
}

export async function fetchWikipediaCoverOptions(
  title: string,
  platform: Platform,
  limit: number = 6
): Promise<WikiCoverOption[]> {
  const searchQuery = buildSearchQuery(title, platform);
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: searchQuery,
    gsrlimit: String(Math.max(limit * 3, 12)),
    prop: 'pageimages|categories',
    piprop: 'thumbnail',
    pithumbsize: '480',
    cllimit: 'max'
  });

  const endpoint = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return [];
    }

    const data: WikiSearchResponse = await response.json();
    const pages = data.query?.pages;
    if (pages === undefined) {
      return [];
    }

    return Object.values(pages)
      .filter((page) => isVideoGamePage(page))
      .filter(
        (page): page is Required<Pick<WikiPage, 'pageid' | 'title' | 'thumbnail'>> =>
          page.pageid !== undefined && page.title !== undefined && page.thumbnail !== undefined
      )
      .sort((a, b) => scorePage(b, title, platform) - scorePage(a, title, platform))
      .map((page) => ({
        id: page.pageid,
        title: page.title,
        thumbnailUrl: page.thumbnail.source
      }))
      .filter((option, index, options) => options.findIndex((item) => item.thumbnailUrl === option.thumbnailUrl) === index)
      .slice(0, limit);
  } catch {
    return [];
  }
}
