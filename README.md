# Gestion de formularios tipados (React + TypeScript)

Aplicacion de ejemplo para registrar videojuegos (PS1, PS2, PS3, PS4, PS5, Nintendo y PC) con formulario totalmente tipado.

## Requisitos cubiertos

- Componente padre con estado principal: `src/components/GameManager.tsx`
- Componente formulario: `src/components/GameForm.tsx`
- Componente listado: `src/components/GameList.tsx`
- Props tipadas entre componentes (sin `any`)
- Modelo tipado: `src/types.ts`
- `useState` con tipos explicitos en todos los estados
- Eventos tipados:
  - `ChangeEvent<HTMLInputElement>`
  - `ChangeEvent<HTMLSelectElement>`
  - `FormEvent<HTMLFormElement>`
  - `MouseEvent<HTMLButtonElement>`
- Formulario controlado para crear y editar
- TypeScript `strict: true` en `tsconfig.json`
- Uso de Radix UI: `@radix-ui/react-checkbox`

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`

## Notas

- No se usa `any`
- No se usa cast forzado con `as`
