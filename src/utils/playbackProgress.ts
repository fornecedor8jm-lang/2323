/**
 * Playback progress tracker for movies and series episodes
 */

export interface PlaybackProgress {
  id: string;
  title: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
  completed?: boolean;
}

const STORAGE_KEY = 'cineclub_playback_progress';

export function getPlaybackProgress(id: string): PlaybackProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const records: Record<string, PlaybackProgress> = JSON.parse(raw);
    return records[id] || null;
  } catch (e) {
    console.error('Error reading playback progress:', e);
    return null;
  }
}

export function getAllPlaybackProgress(): Record<string, PlaybackProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function savePlaybackProgress(
  id: string,
  title: string,
  currentTime: number,
  duration: number
): void {
  if (!id || !duration || duration <= 0) return;

  try {
    const records = getAllPlaybackProgress();
    const isCompleted = currentTime / duration > 0.92;

    records[id] = {
      id,
      title,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      updatedAt: Date.now(),
      completed: isCompleted,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving playback progress:', e);
  }
}

export function clearPlaybackProgress(id: string): void {
  try {
    const records = getAllPlaybackProgress();
    delete records[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error clearing playback progress:', e);
  }
}

export function formatTimeDisplay(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hours = Math.floor(mins / 60);

  if (hours > 0) {
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins < 10 ? '0' : ''}${remainingMins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
