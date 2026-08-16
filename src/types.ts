export type MediaType = 'Série' | 'Filme' | 'Anime';

export type LinkProvider = 'drive' | 'photos' | 'youtube' | 'gofile' | 'direct' | 'none';

export interface AccessLink {
  id: string;
  label: string;
  provider: LinkProvider;
  url?: string;
  season?: number | string;
  episode?: number | string;
  audioVariant?: 'Dublado' | 'Legendado' | 'Nacional' | 'Original';
  note?: string;
}

export type EditorialCategory = 
  | 'sobrenatural' 
  | 'terror' 
  | 'maratonar' 
  | 'historias' 
  | 'filmes' 
  | 'animes';

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  posterUrl: string;
  heroUrl?: string;
  rating: number; // IMDb rating
  year: number | string;
  genres: string[];
  synopsis: string;
  editorialCuratorNote?: string;
  ranking?: number; // e.g. 1 for The Boys
  isFeatured?: boolean;
  isRecentlyAdded?: boolean;
  editorialCategory: EditorialCategory;
  durationOrSeasons?: string;
  directorOrCreator?: string;
  cast?: string[];
  ageRating?: string;
  accessLinks: AccessLink[];
}

export interface EditorialArticle {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  category: string;
  readTime: string;
  date: string;
  coverImage: string;
  content: string;
  highlightQuote?: string;
  relatedMediaIds: string[];
}
