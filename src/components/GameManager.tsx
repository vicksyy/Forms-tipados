import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import GameForm from './GameForm';
import GameList from './GameList';
import type { Platform, VideoGame } from '../types';
import { fetchWikipediaCover } from '../lib/wikiCover';

const STORAGE_KEY = 'typed-games';

const PLATFORMS: Platform[] = ['PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'Nintendo', 'PC'];

function createId(): string {
  return crypto.randomUUID();
}

function isPlatform(value: string): value is Platform {
  return PLATFORMS.some((platform) => platform === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isVideoGame(value: unknown): value is VideoGame {
  if (!isRecord(value)) {
    return false;
  }

  const id = value.id;
  const title = value.title;
  const platform = value.platform;
  const year = value.year;
  const completed = value.completed;
  const coverUrl = value.coverUrl;
  const rating = value.rating;

  return (
    typeof id === 'string' &&
    typeof title === 'string' &&
    typeof platform === 'string' &&
    isPlatform(platform) &&
    typeof year === 'number' &&
    typeof completed === 'boolean' &&
    typeof coverUrl === 'string' &&
    typeof rating === 'number' &&
    rating >= 0 &&
    rating <= 5
  );
}

function isLegacyVideoGame(value: unknown): value is Omit<VideoGame, 'coverUrl' | 'rating'> {
  if (!isRecord(value)) {
    return false;
  }

  const id = value.id;
  const title = value.title;
  const platform = value.platform;
  const year = value.year;
  const completed = value.completed;

  return (
    typeof id === 'string' &&
    typeof title === 'string' &&
    typeof platform === 'string' &&
    isPlatform(platform) &&
    typeof year === 'number' &&
    typeof completed === 'boolean'
  );
}

function isSemiLegacyVideoGame(value: unknown): value is Omit<VideoGame, 'rating'> {
  if (!isRecord(value)) {
    return false;
  }

  const id = value.id;
  const title = value.title;
  const platform = value.platform;
  const year = value.year;
  const completed = value.completed;
  const coverUrl = value.coverUrl;

  return (
    typeof id === 'string' &&
    typeof title === 'string' &&
    typeof platform === 'string' &&
    isPlatform(platform) &&
    typeof year === 'number' &&
    typeof completed === 'boolean' &&
    typeof coverUrl === 'string'
  );
}

function loadGamesFromStorage(): VideoGame[] {
  const storedValue = localStorage.getItem(STORAGE_KEY);
  if (storedValue === null) {
    return [];
  }

  let parsedValue: unknown = null;
  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    return [];
  }

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue
    .map((item) => {
      if (isVideoGame(item)) {
        return item;
      }

      if (isSemiLegacyVideoGame(item)) {
        return { ...item, rating: 0 };
      }

      if (isLegacyVideoGame(item)) {
        return { ...item, coverUrl: '', rating: 0 };
      }

      return null;
    })
    .filter((item): item is VideoGame => item !== null);
}

export default function GameManager() {
  const [games, setGames] = useState<VideoGame[]>(loadGamesFromStorage);
  const [editingGame, setEditingGame] = useState<VideoGame | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  }, [games]);

  const handleOpenCreateClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setEditingGame(null);
    setIsFormOpen(true);
  };

  const resolveCoverUrl = async (game: Omit<VideoGame, 'id'>): Promise<string> => {
    const trimmedCoverUrl = game.coverUrl.trim();
    if (trimmedCoverUrl !== '') {
      return trimmedCoverUrl;
    }

    return fetchWikipediaCover(game.title, game.platform);
  };

  const handleCreateGame = async (newGame: Omit<VideoGame, 'id'>) => {
    const resolvedCoverUrl = await resolveCoverUrl(newGame);
    const gameWithId: VideoGame = {
      id: createId(),
      ...newGame,
      coverUrl: resolvedCoverUrl
    };

    setGames((prevGames) => [gameWithId, ...prevGames]);
    setIsFormOpen(false);
  };

  const handleUpdateGame = async (id: string, updatedGame: Omit<VideoGame, 'id'>) => {
    const resolvedCoverUrl = await resolveCoverUrl(updatedGame);
    setGames((prevGames) =>
      prevGames.map((game) =>
        game.id === id
          ? {
              id,
              ...updatedGame,
              coverUrl: resolvedCoverUrl
            }
          : game
      )
    );

    setEditingGame(null);
    setIsFormOpen(false);
  };

  const handleDeleteGame = (id: string) => {
    setGames((prevGames) => prevGames.filter((game) => game.id !== id));
    setEditingGame((prevEditing) => (prevEditing?.id === id ? null : prevEditing));
  };

  const handleStartEdit = (game: VideoGame) => {
    setEditingGame(game);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingGame(null);
    setIsFormOpen(false);
  };

  return (
    <main className="layout">
      <h1>Gestion de Videojuegos</h1>
      <GameList
        games={games}
        onStartEdit={handleStartEdit}
        onDelete={handleDeleteGame}
        onOpenCreate={handleOpenCreateClick}
      />

      {isFormOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <GameForm
              editingGame={editingGame}
              onCreate={handleCreateGame}
              onUpdate={handleUpdateGame}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </main>
  );
}
