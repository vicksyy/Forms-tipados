import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { VideoGame } from '../types';

interface GameListProps {
  games: VideoGame[];
  onStartEdit: (game: VideoGame) => void;
  onDelete: (id: string) => void;
  onOpenCreate: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function GameList({ games, onStartEdit, onDelete, onOpenCreate }: GameListProps) {
  const [pendingDeleteGame, setPendingDeleteGame] = useState<VideoGame | null>(null);

  const renderStars = (rating: number) => {
    return (
      <span className="stars" aria-label={`Valoracion ${rating} de 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < rating ? 'star filled' : 'star empty'}>
            ★
          </span>
        ))}
      </span>
    );
  };

  const handleEditClick =
    (game: VideoGame) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onStartEdit(game);
    };

  const handleDeleteClick =
    (game: VideoGame) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setPendingDeleteGame(game);
    };

  const handleCancelDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPendingDeleteGame(null);
  };

  const handleConfirmDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (pendingDeleteGame === null) {
      return;
    }

    onDelete(pendingDeleteGame.id);
    setPendingDeleteGame(null);
  };

  return (
    <section className="nintendo-shell" aria-label="Listado de videojuegos">
      <header className="nintendo-topbar" />

      <div className="top-actions">
        <button type="button" onClick={onOpenCreate}>
          Anadir videojuego
        </button>
      </div>

      <div className="nintendo-subbar">
        <p>Total({games.length})</p>
      </div>

      {games.length === 0 ? (
        <p className="empty-message">Todavia no hay videojuegos anadidos.</p>
      ) : (
        <ul className="card-grid">
          {games.map((game) => (
            <li key={game.id} className="nintendo-card">
              <div className="cover-wrapper">
                <button
                  type="button"
                  className="cover-delete-btn"
                  onClick={handleDeleteClick(game)}
                  aria-label={`Eliminar ${game.title}`}
                >
                  ×
                </button>
                <button
                  type="button"
                  className="cover-edit-btn"
                  onClick={handleEditClick(game)}
                  aria-label={`Editar ${game.title}`}
                >
                  ✎
                </button>
                {game.coverUrl === '' ? (
                  <div className="cover-fallback">{game.title}</div>
                ) : (
                  <img src={game.coverUrl} alt={game.title} className="cover-image" />
                )}
              </div>
              <div className="game-meta">
                <strong>{game.title}</strong>
                <p>
                  {game.platform} - {game.year}
                </p>
                <p className="game-rating">{renderStars(game.rating)}</p>
                <p className={game.completed ? 'game-status done' : 'game-status pending'}>
                  <span className="status-dot">{game.completed ? '✔' : '○'}</span>
                  {game.completed ? 'Completado' : 'Pendiente'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pendingDeleteGame !== null && (
        <div className="delete-modal-overlay" role="dialog" aria-modal="true">
          <div className="delete-modal">
            <h3>Eliminar videojuego</h3>
            <p>
              ¿Seguro que quieres eliminar <strong>{pendingDeleteGame.title}</strong>?
            </p>
            <div className="actions delete-modal-actions">
              <button type="button" className="danger" onClick={handleConfirmDelete}>
                Eliminar
              </button>
              <button type="button" className="secondary" onClick={handleCancelDelete}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
