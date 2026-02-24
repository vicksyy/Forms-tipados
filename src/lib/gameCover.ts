import type { Platform } from '../types';
import { fetchWikipediaCover, fetchWikipediaCoverOptions, type WikiCoverOption } from './wikiCover';

export interface GameCoverOption {
  id: string;
  title: string;
  thumbnailUrl: string;
  releaseDate: string;
  platforms: string[];
  genres: string[];
  source: 'rawg' | 'wikipedia';
}

export interface GameAutofillData {
  title: string;
  platform: Platform;
  year: number;
  coverUrl: string;
}

interface RawgPlatformNode {
  platform?: {
    name?: string;
  };
}

interface RawgGame {
  id?: number;
  name?: string;
  background_image?: string | null;
  background_image_additional?: string | null;
  released?: string | null;
  platforms?: RawgPlatformNode[];
  genres?: Array<{ name?: string }>;
  rating?: number;
  ratings_count?: number;
  added?: number;
  metacritic?: number | null;
}

interface RawgResponse {
  results?: RawgGame[];
}

interface RawgGameWithCover {
  id: number;
  name: string;
  background_image?: string | null;
  background_image_additional?: string | null;
  released?: string | null;
  platforms?: RawgPlatformNode[];
  genres?: Array<{ name?: string }>;
  rating?: number;
  ratings_count?: number;
  added?: number;
  metacritic?: number | null;
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

function isMainGameCandidate(gameName: string, queryTitle: string): boolean {
  const normalizedName = normalizeText(gameName);
  const normalizedQuery = normalizeText(queryTitle);

  const blockedTerms = [
    'dlc',
    'expansion',
    'expansion pack',
    'season pass',
    'soundtrack',
    'ost',
    'bundle',
    'pack',
    'collection',
    'beta',
    'alpha',
    'demo',
    'trailer',
    'episode',
    'chapter',
    'skin',
    'cosmetic',
    'test server',
    'public test',
    'prototype',
    'mod',
    'development',
    'impact',
    'history of',
    'list of',
    'characters of',
    'soundtrack of',
    'music of'
  ];

  if (blockedTerms.some((term) => normalizedName.includes(term))) {
    return false;
  }

  // Evita resultados que apenas se parecen al titulo escrito.
  if (normalizedQuery.length >= 3 && !normalizedName.includes(normalizedQuery)) {
    return false;
  }

  return true;
}

function getPlatformKeywords(platform: Platform): string[] {
  switch (platform) {
    case 'PS1':
      return ['playstation', 'ps1'];
    case 'PS2':
      return ['playstation 2', 'ps2'];
    case 'PS3':
      return ['playstation 3', 'ps3'];
    case 'PS4':
      return ['playstation 4', 'ps4'];
    case 'PS5':
      return ['playstation 5', 'ps5'];
    case 'Nintendo':
      return ['nintendo', 'switch', 'wii', 'gamecube', '3ds', 'ds'];
    case 'PC':
      return ['pc', 'windows', 'linux', 'mac'];
    default:
      return [];
  }
}

function mapRawgPlatformName(rawgPlatformName: string): Platform | null {
  const value = normalizeText(rawgPlatformName);

  if (value.includes('playstation 5') || value.includes('ps5')) {
    return 'PS5';
  }
  if (value.includes('playstation 4') || value.includes('ps4')) {
    return 'PS4';
  }
  if (value.includes('playstation 3') || value.includes('ps3')) {
    return 'PS3';
  }
  if (value.includes('playstation 2') || value.includes('ps2')) {
    return 'PS2';
  }
  if (value.includes('playstation') || value.includes('ps1')) {
    return 'PS1';
  }
  if (
    value.includes('nintendo') ||
    value.includes('switch') ||
    value.includes('wii') ||
    value.includes('gamecube') ||
    value.includes('game boy') ||
    value.includes('3ds') ||
    value.includes('ds')
  ) {
    return 'Nintendo';
  }
  if (value.includes('pc') || value.includes('windows') || value.includes('linux') || value.includes('mac')) {
    return 'PC';
  }

  return null;
}

function inferPlatformFromRawg(platformNodes: RawgPlatformNode[]): Platform | null {
  const platformNames = platformNodes.map((node) => node.platform?.name ?? '').filter((name) => name !== '');
  for (const platformName of platformNames) {
    const mappedPlatform = mapRawgPlatformName(platformName);
    if (mappedPlatform !== null) {
      return mappedPlatform;
    }
  }

  return null;
}

function parseReleaseYear(released: string | null | undefined): number | null {
  if (typeof released !== 'string') {
    return null;
  }

  const parsedYear = Number(released.slice(0, 4));
  if (Number.isNaN(parsedYear) || parsedYear < 1970 || parsedYear > 2030) {
    return null;
  }

  return parsedYear;
}

function getRawgApiKey(): string {
  const rawgApiKey = import.meta.env.VITE_RAWG_API_KEY;
  if (typeof rawgApiKey !== 'string') {
    return '';
  }

  return rawgApiKey.trim();
}

async function fetchRawgSearchResults(title: string, pageSize: number): Promise<RawgGame[]> {
  const rawgApiKey = getRawgApiKey();
  if (rawgApiKey === '') {
    return [];
  }

  const params = new URLSearchParams({
    key: rawgApiKey,
    search: title,
    page_size: String(pageSize),
    ordering: '-added',
    search_precise: 'false'
  });

  const endpoint = `https://api.rawg.io/api/games?${params.toString()}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return [];
    }

    const data: RawgResponse = await response.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

function scoreRawgGame(game: RawgGame, title: string, platform: Platform): number {
  const titleQuery = normalizeText(title);
  const gameTitle = normalizeText(game.name ?? '');
  const platformText = normalizeText(
    (game.platforms ?? [])
      .map((node) => node.platform?.name ?? '')
      .join(' ')
  );

  let score = 0;
  if (gameTitle === titleQuery) {
    score += 100;
  } else if (gameTitle.startsWith(titleQuery)) {
    score += 70;
  } else if (gameTitle.includes(titleQuery)) {
    score += 45;
  }

  if (getPlatformKeywords(platform).some((keyword) => platformText.includes(keyword))) {
    score += 25;
  }

  if ((game.background_image ?? '') !== '') {
    score += 10;
  }

  if (typeof game.ratings_count === 'number') {
    score += Math.min(game.ratings_count / 200, 30);
  }
  if (typeof game.added === 'number') {
    score += Math.min(game.added / 400, 20);
  }
  if (typeof game.metacritic === 'number') {
    score += Math.min(game.metacritic / 4, 25);
  }
  if (typeof game.rating === 'number') {
    score += Math.min(game.rating * 2, 10);
  }

  return score;
}

function pickBestRawgImage(game: RawgGame): string {
  if (typeof game.background_image_additional === 'string' && game.background_image_additional !== '') {
    return game.background_image_additional;
  }

  if (typeof game.background_image === 'string' && game.background_image !== '') {
    return game.background_image;
  }

  return '';
}

function mapWikiOption(option: WikiCoverOption): GameCoverOption {
  return {
    id: `wiki-${option.id}`,
    title: option.title,
    thumbnailUrl: option.thumbnailUrl,
    releaseDate: '',
    platforms: [],
    genres: [],
    source: 'wikipedia'
  };
}

async function fetchRawgCoverOptions(
  title: string,
  platform: Platform,
  limit: number
): Promise<GameCoverOption[]> {
  const results = await fetchRawgSearchResults(title, Math.max(limit * 3, 12));

  return results
    .filter(
      (game): game is RawgGameWithCover =>
        typeof game.id === 'number' &&
        typeof game.name === 'string' &&
        isMainGameCandidate(game.name, title) &&
        pickBestRawgImage(game) !== ''
    )
    .sort((a, b) => scoreRawgGame(b, title, platform) - scoreRawgGame(a, title, platform))
    .map((game): GameCoverOption => ({
      id: `rawg-${game.id}`,
      title: game.name,
      thumbnailUrl: pickBestRawgImage(game),
      releaseDate: typeof game.released === 'string' ? game.released : '',
      platforms: (game.platforms ?? [])
        .map((node) => node.platform?.name ?? '')
        .filter((name) => name !== ''),
      genres: (game.genres ?? []).map((genre) => genre.name ?? '').filter((name) => name !== ''),
      source: 'rawg'
    }))
    .filter((option, index, options) => options.findIndex((item) => item.thumbnailUrl === option.thumbnailUrl) === index)
    .slice(0, limit);
}

export async function fetchGameCoverOptions(
  title: string,
  platform: Platform,
  limit: number = 6
): Promise<GameCoverOption[]> {
  const rawgOptions = await fetchRawgCoverOptions(title, platform, limit);
  if (rawgOptions.length > 0 || getRawgApiKey() !== '') {
    return rawgOptions;
  }

  const wikiOptions = await fetchWikipediaCoverOptions(title, platform, limit);
  return wikiOptions.map(mapWikiOption);
}

export async function fetchGameCover(title: string, platform: Platform): Promise<string> {
  const options = await fetchGameCoverOptions(title, platform, 1);
  if (options.length > 0) {
    return options[0].thumbnailUrl;
  }

  return fetchWikipediaCover(title, platform);
}

export async function fetchGameAutofill(
  title: string,
  fallbackPlatform: Platform,
  fallbackYear: number
): Promise<GameAutofillData> {
  const results = await fetchRawgSearchResults(title, 15);
  const titleQuery = normalizeText(title);

  const bestResult = results
    .filter(
      (game): game is RawgGameWithCover =>
        typeof game.id === 'number' &&
        typeof game.name === 'string' &&
        isMainGameCandidate(game.name, title) &&
        pickBestRawgImage(game) !== ''
    )
    .sort((a, b) => {
      const scoreA = scoreRawgGame(a, titleQuery, fallbackPlatform);
      const scoreB = scoreRawgGame(b, titleQuery, fallbackPlatform);
      return scoreB - scoreA;
    })[0];

  if (bestResult === undefined) {
    const fallbackCover = await fetchGameCover(title, fallbackPlatform);
    return {
      title,
      platform: fallbackPlatform,
      year: fallbackYear,
      coverUrl: fallbackCover
    };
  }

  const inferredPlatform = inferPlatformFromRawg(bestResult.platforms ?? []);
  const inferredYear = parseReleaseYear(bestResult.released);

  return {
    title: bestResult.name,
    platform: inferredPlatform ?? fallbackPlatform,
    year: inferredYear ?? fallbackYear,
    coverUrl: pickBestRawgImage(bestResult)
  };
}
