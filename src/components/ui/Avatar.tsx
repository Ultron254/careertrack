import { useEffect, useState, useSyncExternalStore } from 'react';
import { getAvatarOverride, subscribeAvatar } from '@/lib/avatarStore';
import styles from './Avatar.module.css';

// There are no staff photos in the repository. Real photos arrive through
// User.avatarUrl once the backend caches them from Microsoft Graph
// (/users/{id}/photo/$value); nothing else here needs to change. Until then,
// and whenever an image fails, the avatar shows initials on a colour picked
// deterministically from the brand palette by hashing the user id.

const palette = ['var(--teal)', 'var(--blue)', 'var(--orange)', 'var(--gold)', 'var(--ink-soft)'];

function hashToPalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
}

interface AvatarProps {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: 28 | 34 | 36 | 38 | 42 | 46 | 48 | 64 | 76 | 96;
}

export function Avatar({ userId, name, avatarUrl = null, size = 38 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  // A real Graph photo (avatarUrl) always wins; otherwise fall back to a
  // locally uploaded override so the signed-in user's photo shows everywhere.
  const override = useSyncExternalStore(
    subscribeAvatar,
    () => getAvatarOverride(userId),
    () => null,
  );
  const src = avatarUrl ?? override;
  const showImage = src && !failed;

  // Reset the error flag when the source changes so a new upload can retry.
  useEffect(() => setFailed(false), [src]);

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: showImage ? undefined : hashToPalette(userId),
      }}
      role="img"
      aria-label={name}
    >
      {showImage ? (
        <img src={src} alt="" className={styles.image} onError={() => setFailed(true)} />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
