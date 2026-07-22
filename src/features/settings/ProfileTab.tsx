import { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import { useToast } from '@/components/ui/Toast';
import {
  clearAvatarOverride,
  fileToAvatarDataUrl,
  getAvatarOverride,
  setAvatarOverride,
} from '@/lib/avatarStore';
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
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewId, setPreviewId] = useState(user.id);
  // A staged upload waiting for the user to hit Save, and the currently saved
  // override for this user (so the modal reflects removals immediately).
  const [pending, setPending] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(() => getAvatarOverride(user.id));

  const preview = pending ?? saved;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Choose an image file (PNG or JPG).', 'error');
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setPending(dataUrl);
    } catch {
      toast('That image could not be processed.', 'error');
    }
  };

  const savePhoto = () => {
    if (!pending) return;
    setAvatarOverride(user.id, pending);
    setSaved(pending);
    setPending(null);
    setPickerOpen(false);
    toast('Profile photo updated');
  };

  const removePhoto = () => {
    clearAvatarOverride(user.id);
    setSaved(null);
    setPending(null);
    toast('Profile photo removed');
  };

  const closePicker = () => {
    setPending(null);
    setPickerOpen(false);
  };

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div className={`grain ${styles.cover}`} />
        <div className={styles.identity}>
          <div className={styles.identityAvatar}>
            <Avatar userId={user.id} name={user.name} avatarUrl={user.avatarUrl} size={96} />
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

      <Modal open={pickerOpen} onClose={closePicker} label="Change your profile photo" width={540}>
        <div className={styles.pickerHead}>
          <h2 className={styles.pickerTitle}>Profile photo</h2>
          <button
            type="button"
            className={styles.pickerClose}
            onClick={closePicker}
            aria-label="Close"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <p className={styles.pickerSub}>
          Upload a photo to use across CareerTrack. It is stored on this device for the demo.
        </p>

        <div className={styles.uploadRow}>
          <span className={styles.uploadPreview}>
            {preview ? (
              <img src={preview} alt="Selected profile" />
            ) : (
              <Avatar userId={user.id} name={user.name} size={76} />
            )}
          </span>
          <div className={styles.uploadActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? 'Choose a different image' : 'Upload an image'}
            </button>
            {(saved || pending) && (
              <button type="button" className={styles.removeButton} onClick={removePhoto}>
                Remove photo
              </button>
            )}
            <span className={styles.uploadHint}>PNG or JPG, up to a few MB.</span>
          </div>
        </div>

        <div className={styles.saveRow}>
          <button
            type="button"
            className={styles.savePhoto}
            onClick={savePhoto}
            disabled={!pending}
          >
            Save photo
          </button>
        </div>

        <div className={styles.orDivider}>Or pick a colour for your initials</div>
        <div className={styles.avatarGrid}>
          {swatchIds.map((seed) => (
            <button
              key={seed}
              type="button"
              className={styles.avatarChoice}
              data-on={previewId === seed}
              onClick={() => setPreviewId(seed)}
            >
              <Avatar userId={seed} name={user.name} size={48} />
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
