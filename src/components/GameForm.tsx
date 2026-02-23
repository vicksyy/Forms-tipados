import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import type { Platform, VideoGame } from '../types';

const PLATFORMS: Platform[] = ['PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'Nintendo', 'PC'];

type GameInput = Omit<VideoGame, 'id'>;

interface GameFormProps {
  editingGame: VideoGame | null;
  onCreate: (newGame: GameInput) => Promise<void> | void;
  onUpdate: (id: string, updatedGame: GameInput) => Promise<void> | void;
  onCancel: () => void;
}

const INITIAL_FORM: GameInput = {
  title: '',
  platform: 'PS5',
  year: 2024,
  completed: false,
  coverUrl: '',
  rating: 0
};

const isPlatform = (value: string): value is Platform => {
  return PLATFORMS.some((platform) => platform === value);
};

export default function GameForm({
  editingGame,
  onCreate,
  onUpdate,
  onCancel
}: GameFormProps) {
  const [formData, setFormData] = useState<GameInput>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editingGame === null) {
      setFormData(INITIAL_FORM);
      return;
    }

    setFormData({
      title: editingGame.title,
      platform: editingGame.platform,
      year: editingGame.year,
      completed: editingGame.completed,
      coverUrl: editingGame.coverUrl,
      rating: editingGame.rating
    });
  }, [editingGame]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, title: e.target.value }));
  };

  const handlePlatformChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (!isPlatform(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, platform: value }));
  };

  const handleYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextYear = Number(e.target.value);
    setFormData((prev) => ({ ...prev, year: Number.isNaN(nextYear) ? prev.year : nextYear }));
  };

  const handleCoverUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, coverUrl: e.target.value }));
  };

  const handleCompletedToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFormData((prev) => ({ ...prev, completed: !prev.completed }));
  };

  const handleRatingClick =
    (rating: number) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setFormData((prev) => ({ ...prev, rating: prev.rating === rating ? 0 : rating }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingGame === null) {
        await onCreate(formData);
        setFormData(INITIAL_FORM);
        return;
      }

      await onUpdate(editingGame.id, formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="card form-grid" aria-label="Formulario de videojuegos">
      <h2>{editingGame === null ? 'Nuevo videojuego' : 'Editar videojuego'}</h2>

      <label htmlFor="title">Titulo</label>
      <input
        id="title"
        name="title"
        type="text"
        value={formData.title}
        onChange={handleTitleChange}
        required
      />

      <label htmlFor="platform">Plataforma</label>
      <select id="platform" name="platform" value={formData.platform} onChange={handlePlatformChange}>
        {PLATFORMS.map((platform) => (
          <option key={platform} value={platform}>
            {platform}
          </option>
        ))}
      </select>

      <label htmlFor="year">Ano de lanzamiento</label>
      <input
        id="year"
        name="year"
        type="number"
        min={1970}
        max={2030}
        value={formData.year}
        onChange={handleYearChange}
        required
      />

      <label htmlFor="coverUrl">URL de portada</label>
      <input
        id="coverUrl"
        name="coverUrl"
        type="url"
        value={formData.coverUrl}
        onChange={handleCoverUrlChange}
        placeholder="https://..."
      />

      <label>Valoracion</label>
      <div className="rating-row" role="group" aria-label="Valorar videojuego con estrellas">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={formData.rating >= star ? 'star-btn active' : 'star-btn'}
            onClick={handleRatingClick(star)}
            aria-label={`Valorar con ${star} estrella${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>

      <label>Estado</label>
      <button
        type="button"
        className={formData.completed ? 'status-toggle completed' : 'status-toggle pending'}
        onClick={handleCompletedToggle}
        aria-pressed={formData.completed}
      >
        <span className="status-icon">{formData.completed ? '✔' : '○'}</span>
        {formData.completed ? 'Completado' : 'Pendiente'}
      </button>

      <div className="actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : editingGame === null ? 'Crear' : 'Guardar cambios'}
        </button>
        <button type="button" className="secondary" onClick={handleCancelClick} disabled={isSubmitting}>
          {editingGame === null ? 'Cerrar' : 'Cancelar edicion'}
        </button>
      </div>
    </form>
  );
}
