import { useState } from 'react';
import type { MouseEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
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

  const handleDeleteDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPendingDeleteGame(null);
    }
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
    <Dialog.Root open={pendingDeleteGame !== null} onOpenChange={handleDeleteDialogOpenChange}>
      <Tooltip.Provider delayDuration={150}>
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
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        className="cover-delete-btn"
                        onClick={handleDeleteClick(game)}
                        aria-label={`Eliminar ${game.title}`}
                      >
                        ×
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="radix-tooltip-content" side="top" sideOffset={6}>
                        Eliminar
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        className="cover-edit-btn"
                        onClick={handleEditClick(game)}
                        aria-label={`Editar ${game.title}`}
                      >
                        ✎
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="radix-tooltip-content" side="top" sideOffset={6}>
                        Editar
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                {game.coverUrl === '' ? (
                  <div className="cover-fallback">{game.title}</div>
                ) : (
                  <img src={game.coverUrl} alt={game.title} className="cover-image" />
                )}
                <div className="cover-rating-overlay">{renderStars(game.rating)}</div>
              </div>
              <div className="game-meta">
                <strong>{game.title}</strong>
                <p>
                  {game.platform} - {game.year}
                </p>
                <p className={game.completed ? 'game-status done' : 'game-status pending'}>
                  <span className="status-dot">{game.completed ? '✔' : '○'}</span>
                  {game.completed ? 'Completado' : 'Pendiente'}
                </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Dialog.Portal>
          <Dialog.Overlay className="delete-modal-overlay" />
          <Dialog.Content className="delete-modal">
            <Dialog.Title asChild>
              <h3>Eliminar videojuego</h3>
            </Dialog.Title>
            <Dialog.Description asChild>
              <p>
                ¿Seguro que quieres eliminar <strong>{pendingDeleteGame?.title}</strong>?
              </p>
            </Dialog.Description>
            <div className="actions delete-modal-actions">
              <button type="button" className="danger" onClick={handleConfirmDelete}>
                Eliminar
              </button>
              <Dialog.Close asChild>
                <button type="button" className="secondary">
                  Cancelar
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
        </section>
      </Tooltip.Provider>
    </Dialog.Root>
  );
}
