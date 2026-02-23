import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
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
  coverUrl: ''
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
      coverUrl: editingGame.coverUrl
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

  const handleCompletedChange = (checked: boolean | 'indeterminate') => {
    setFormData((prev) => ({ ...prev, completed: checked === true }));
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

      <label className="inline-checkbox" htmlFor="completed">
        <Checkbox.Root
          id="completed"
          checked={formData.completed}
          onCheckedChange={handleCompletedChange}
          className="checkbox-root"
        >
          <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
        </Checkbox.Root>
        Completado
      </label>

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
