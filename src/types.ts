export type Platform =
  | 'PS1'
  | 'PS2'
  | 'PS3'
  | 'PS4'
  | 'PS5'
  | 'Nintendo'
  | 'PC';

export interface VideoGame {
  id: string;
  title: string;
  platform: Platform;
  year: number;
  completed: boolean;
  coverUrl: string;
}
