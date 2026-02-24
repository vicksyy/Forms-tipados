import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import type { Platform, VideoGame } from '../types';
import { fetchGameCoverOptions, type GameCoverOption } from '../lib/gameCover';
import * as Select from '@radix-ui/react-select';

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

const inferPlatformFromNames = (platformNames: string[]): Platform | null => {
  const normalized = platformNames.join(' ').toLowerCase();

  if (normalized.includes('playstation 5') || normalized.includes('ps5')) {
    return 'PS5';
  }
  if (normalized.includes('playstation 4') || normalized.includes('ps4')) {
    return 'PS4';
  }
  if (normalized.includes('playstation 3') || normalized.includes('ps3')) {
    return 'PS3';
  }
  if (normalized.includes('playstation 2') || normalized.includes('ps2')) {
    return 'PS2';
  }
  if (normalized.includes('playstation') || normalized.includes('ps1')) {
    return 'PS1';
  }
  if (
    normalized.includes('nintendo') ||
    normalized.includes('switch') ||
    normalized.includes('wii') ||
    normalized.includes('gamecube') ||
    normalized.includes('3ds') ||
    normalized.includes('ds')
  ) {
    return 'Nintendo';
  }
  if (
    normalized.includes('pc') ||
    normalized.includes('windows') ||
    normalized.includes('linux') ||
    normalized.includes('mac')
  ) {
    return 'PC';
  }

  return null;
};

export default function GameForm({
  editingGame,
  onCreate,
  onUpdate,
  onCancel
}: GameFormProps) {
  const [formData, setFormData] = useState<GameInput>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [titleQuery, setTitleQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GameCoverOption[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const lockedSuggestionQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (editingGame === null) {
      setFormData(INITIAL_FORM);
      setTitleQuery('');
      setShowSuggestions(false);
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
    setTitleQuery(editingGame.title);
  }, [editingGame]);

  const applySuggestion = (option: GameCoverOption) => {
    const releaseYear = Number(option.releaseDate.slice(0, 4));
    const hasValidYear = !Number.isNaN(releaseYear) && releaseYear >= 1970 && releaseYear <= 2030;
    const inferredPlatform = inferPlatformFromNames(option.platforms);

    setFormData((prev) => ({
      ...prev,
      title: option.title,
      platform: inferredPlatform ?? prev.platform,
      year: hasValidYear ? releaseYear : prev.year,
      coverUrl: option.thumbnailUrl
    }));
    setSelectedSuggestionId(option.id);
  };

  useEffect(() => {
    const normalizedQuery = titleQuery.trim();
    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    if (lockedSuggestionQueryRef.current !== null && normalizedQuery === lockedSuggestionQueryRef.current) {
      setIsLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestions(true);

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const options = await fetchGameCoverOptions(normalizedQuery, formData.platform, 4);
        if (cancelled) {
          return;
        }

        setSuggestions(options);
        setIsLoadingSuggestions(false);

        if (options.length > 0) {
          applySuggestion(options[0]);
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [titleQuery, formData.platform]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextTitle = e.target.value;
    lockedSuggestionQueryRef.current = null;
    setTitleQuery(nextTitle);
    setShowSuggestions(nextTitle.trim().length >= 2);
    setFormData((prev) => ({ ...prev, title: nextTitle }));
    setSelectedSuggestionId('');
  };

  const handlePlatformChange = (value: string) => {
    if (!isPlatform(value)) {
      return;
    }

    lockedSuggestionQueryRef.current = null;
    setFormData((prev) => ({ ...prev, platform: value }));
    if (titleQuery.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSetCompleted =
    (completed: boolean) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setFormData((prev) => ({ ...prev, completed }));
    };

  const handleSelectSuggestion =
    (option: GameCoverOption) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      lockedSuggestionQueryRef.current = option.title.trim();
      setTitleQuery(option.title);
      setShowSuggestions(false);
      applySuggestion(option);
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

      <label htmlFor="title">Título</label>
      <div className="title-suggest-wrap">
        <input
          id="title"
          name="title"
          type="text"
          value={titleQuery}
          onChange={handleTitleChange}
          placeholder="Escribe al menos 2 letras para ver sugerencias"
          required
        />
      {showSuggestions && titleQuery.trim().length >= 2 && (
        <div className="suggestions-popover">
            <div className="cover-picker">
              {isLoadingSuggestions ? (
                <p className="cover-hint">Buscando coincidencias...</p>
              ) : (
                <div className="cover-options-grid">
                  {suggestions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={selectedSuggestionId === option.id ? 'cover-option active' : 'cover-option'}
                      onClick={handleSelectSuggestion(option)}
                      aria-label={`Usar sugerencia ${option.title}`}
                    >
                      <img src={option.thumbnailUrl} alt={option.title} className="cover-option-image" />
                      <span className="cover-option-title">{option.title}</span>
                      <span className="cover-option-meta">
                        {option.releaseDate !== '' ? option.releaseDate : 'Sin fecha'} -{' '}
                        {option.platforms.length > 0 ? option.platforms.slice(0, 2).join(', ') : 'Sin plataforma'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {formData.coverUrl !== '' && (
        <div className="selected-cover-preview">
          <img src={formData.coverUrl} alt={`Portada seleccionada de ${formData.title}`} />
        </div>
      )}

      <label htmlFor="platform">Plataforma</label>
      <Select.Root value={formData.platform} onValueChange={handlePlatformChange}>
        <Select.Trigger id="platform" className="radix-select-trigger" aria-label="Plataforma">
          <Select.Value />
          <Select.Icon className="radix-select-icon">▾</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="radix-select-content" position="popper" sideOffset={6}>
            <Select.Viewport className="radix-select-viewport">
              {PLATFORMS.map((platform) => (
                <Select.Item key={platform} value={platform} className="radix-select-item">
                  <Select.ItemText>{platform}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <label htmlFor="year">Año de lanzamiento</label>
      <input
        id="year"
        name="year"
        type="number"
        min={1970}
        max={2030}
        value={formData.year}
        readOnly
      />

      <label>Valoración</label>
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
      <div className="status-chooser" role="group" aria-label="Estado del videojuego">
        <button
          type="button"
          className={formData.completed ? 'status-choice active completed' : 'status-choice completed'}
          onClick={handleSetCompleted(true)}
          aria-pressed={formData.completed}
        >
          <span className="status-choice-icon">◉</span>
          Completado
        </button>
        <button
          type="button"
          className={!formData.completed ? 'status-choice active pending' : 'status-choice pending'}
          onClick={handleSetCompleted(false)}
          aria-pressed={!formData.completed}
        >
          <span className="status-choice-icon">◌</span>
          Pendiente
        </button>
      </div>

      <div className="actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : editingGame === null ? 'Crear' : 'Guardar'}
        </button>
        <button type="button" className="secondary" onClick={handleCancelClick} disabled={isSubmitting}>
          {editingGame === null ? 'Cerrar' : 'Cancelar'}
        </button>
      </div>
    </form>
  );
}
