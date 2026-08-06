// Client side store for user-uploaded profile photos.
//
// The backend has no photo-write endpoint yet (real photos will arrive via
// Microsoft Graph on User.avatarUrl). Until then an uploaded image is kept in
// localStorage, keyed per user id, and surfaced through Avatar so it shows on
// every current-user surface (top bar, menu, mobile, settings) and never leaks
// onto other people. Swap these helpers for a mutation when the API lands.

const keyFor = (userId: string) => `careertrack.avatar.${userId}`;

const cache = new Map<string, string | null>();
const listeners = new Set<() => void>();

function read(userId: string): string | null {
  if (cache.has(userId)) return cache.get(userId) ?? null;
  let value: string | null = null;
  try {
    value = localStorage.getItem(keyFor(userId));
  } catch {
    value = null;
  }
  cache.set(userId, value);
  return value;
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getAvatarOverride(userId: string): string | null {
  return read(userId);
}

export function setAvatarOverride(userId: string, dataUrl: string) {
  cache.set(userId, dataUrl);
  try {
    localStorage.setItem(keyFor(userId), dataUrl);
  } catch {
    // Quota or private-mode failures are non-fatal; the in-memory cache still
    // reflects the change for this session.
  }
  emit();
}

export function clearAvatarOverride(userId: string) {
  cache.set(userId, null);
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    // ignore
  }
  emit();
}

export function subscribeAvatar(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Downscale a picked image to a square-ish thumbnail and return a JPEG data URL.
// Keeps localStorage well under quota and normalises huge camera photos.
export function fileToAvatarDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('That image could not be loaded.'));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
