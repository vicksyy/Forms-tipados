import type { MouseEvent } from 'react';
import type { VideoGame } from '../types';

interface GameListProps {
  games: VideoGame[];
  onStartEdit: (game: VideoGame) => void;
  onDelete: (id: string) => void;
  onOpenCreate: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function GameList({ games, onStartEdit, onDelete, onOpenCreate }: GameListProps) {
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
    (id: string) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onDelete(id);
    };

  return (
    <section className="nintendo-shell" aria-label="Listado de videojuegos">
      <header className="nintendo-topbar">
        <div className="brand">
          <span className="brand-icon" />
          <h2>Virtual Game Cards</h2>
        </div>
        <div className="profile-pill">Jugador</div>
      </header>

      <div className="top-actions">
        <button type="button" onClick={onOpenCreate}>
          Anadir videojuego
        </button>
      </div>

      <div className="nintendo-subbar">
        <p>Date acquired (newest first)</p>
        <p>All({games.length})</p>
      </div>

      {games.length === 0 ? (
        <p className="empty-message">Todavia no hay videojuegos anadidos.</p>
      ) : (
        <ul className="card-grid">
          {games.map((game) => (
            <li key={game.id} className="nintendo-card">
              <div className="cover-wrapper">
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
              <div className="actions">
                <button type="button" onClick={handleEditClick(game)}>
                  Editar
                </button>
                <button type="button" className="danger" onClick={handleDeleteClick(game.id)}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
