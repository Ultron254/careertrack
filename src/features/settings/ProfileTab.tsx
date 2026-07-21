import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import type { User } from '@/types/domain';
import styles from './Settings.module.css';

const roleTags: Record<User['role'], string> = {
  employee: 'Employee',
  manager: 'Line manager',
  people_team: 'People team',
  admin: 'Admin',
};

// The avatar picker previews a colour for the initials fallback. Real photos
// arrive through User.avatarUrl once Microsoft Graph is wired; picking a colour
// here is a local preference only and does not overwrite a real photo.
const swatchIds = ['tint-a', 'tint-b', 'tint-c', 'tint-d', 'tint-e', 'tint-f'];

export function ProfileTab({ user }: { user: User }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewId, setPreviewId] = useState(user.id);

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div className={`grain ${styles.cover}`} />
        <div className={styles.identity}>
          <div className={styles.identityAvatar}>
            <Avatar userId={previewId} name={user.name} avatarUrl={user.avatarUrl} size={96} />
          </div>
          <div className={styles.identityBody}>
            <h1 className={styles.identityName}>{user.name}</h1>
            <div className={styles.identityMeta}>
              {user.jobTitle} {'\u00B7'} {roleTags[user.role]}
            </div>
            <div className={styles.identityMeta} style={{ marginTop: 8 }}>
              {user.email}
            </div>
          </div>
          <button type="button" className={styles.changePhoto} onClick={() => setPickerOpen(true)}>
            Change photo
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 12 }}>
          Skills and strengths
        </div>
        <div className={styles.skills}>
          {['Client relations', 'Media strategy', 'Pitching', 'Copywriting', 'Team leadership'].map(
            (skill) => (
              <span key={skill} className={styles.skill}>
                {skill}
              </span>
            ),
          )}
        </div>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} label="Choose your avatar" width={540}>
        <div className={styles.pickerHead}>
          <h2 className={styles.pickerTitle}>Choose your avatar</h2>
          <button
            type="button"
            className={styles.pickerClose}
            onClick={() => setPickerOpen(false)}
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <p className={styles.pickerSub}>
          Pick a colour for your initials. A real photo replaces this automatically once your
          Microsoft account photo is available.
        </p>
        <div className={styles.avatarGrid}>
          {swatchIds.map((seed) => (
            <button
              key={seed}
              type="button"
              className={styles.avatarChoice}
              data-on={previewId === seed}
              onClick={() => {
                setPreviewId(seed);
                setPickerOpen(false);
              }}
            >
              <Avatar userId={seed} name={user.name} size={48} />
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
