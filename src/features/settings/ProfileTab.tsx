import { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/icons/Icon';
import { useToast } from '@/components/ui/Toast';
import { useUsers } from '@/api/queries/org';
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

// dummy profile summary — replace with the person's real appraisal and activity
// figures once the API exposes them.
const atAGlance = [
  { label: 'Avg rating', value: '3', sub: 'of 4' },
  { label: 'Active goals', value: '4', sub: 'this cycle' },
  { label: 'Feedback received', value: '6', sub: 'this cycle' },
  { label: 'At the agency', value: '3 yrs', sub: 'tenure' },
];

// dummy feedback highlights — replace with the latest peer feedback for this user.
const recentFeedback = [
  {
    id: 'fb-1',
    quote: 'Kept the client calm during the rebrand and still hit the deadline.',
    author: 'Sana Patel',
    tag: 'Client',
  },
  {
    id: 'fb-2',
    quote: 'Great mentoring on the new starters — they ramped up fast.',
    author: 'Grace Achieng',
    tag: 'People',
  },
];

// A Systems Administrator carries no goals, ratings or line manager, so the
// profile swaps the performance summary for account and system context.
// Everything below is dummy — replace with figures from the identity provider
// and audit service once those endpoints exist.
const adminAccess = ['Super admin', 'Account provisioning', 'Cycle configuration', 'Audit access'];

const adminGlance = [
  { label: 'Accounts managed', value: '342', sub: 'across 6 depts' },
  { label: 'Line managers', value: '28', sub: 'assigned' },
  { label: 'Open invites', value: '3', sub: 'awaiting sign-in' },
  { label: 'Last sign-in', value: 'Today', sub: '08:14 · Nairobi' },
];

const integrations = [
  { id: 'entra', name: 'Microsoft Entra ID', meta: 'Single sign-on · SCIM provisioning' },
  { id: 'outlook', name: 'Outlook calendar', meta: 'Meeting sync across the org' },
  { id: 'email', name: 'Email (Microsoft 365)', meta: 'Reminders & invitations' },
];

const adminActivity = [
  { id: 'a1', text: 'Updated cycle reminder offsets to 14 / 7 / 3 / 1 days', when: '2 hours ago' },
  { id: 'a2', text: 'Invited ali.hassan@oxygene.africa as PR Executive', when: 'Yesterday' },
  { id: 'a3', text: 'Suspended Ruth Kamau pending offboarding', when: '2 days ago' },
  { id: 'a4', text: 'Enabled the People category at 30% weight', when: 'Last week' },
];

// The avatar picker previews a colour for the initials fallback. Real photos
// arrive through User.avatarUrl once Microsoft Graph is wired; picking a colour
// here is a local preference only and does not overwrite a real photo.
const swatchIds = ['tint-a', 'tint-b', 'tint-c', 'tint-d', 'tint-e', 'tint-f'];

export function ProfileTab({ user }: { user: User }) {
  const toast = useToast();
  const usersQuery = useUsers();
  const manager = usersQuery.data?.find((candidate) => candidate.id === user.managerId) ?? null;
  const isAdmin = user.role === 'admin';
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
        <div className={`oxy-plate oxy-wash grain ${styles.cover}`} />
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
          {isAdmin ? 'Access & permissions' : 'Skills and strengths'}
        </div>
        <div className={styles.skills}>
          {(isAdmin
            ? adminAccess
            : ['Client relations', 'Media strategy', 'Pitching', 'Copywriting', 'Team leadership']
          ).map((tag) => (
            <span key={tag} className={styles.skill}>
              {tag}
            </span>
          ))}
        </div>
        {isAdmin && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '14px 0 0', lineHeight: 1.5 }}>
            Administrators manage accounts and configuration only — they cannot see goals, comments
            or ratings. Sensitive actions are logged and require two approvers.
          </p>
        )}
      </div>

      <div className={styles.glanceGrid}>
        {(isAdmin ? adminGlance : atAGlance).map((stat) => (
          <div key={stat.label} className={`card ${styles.glanceCard}`}>
            <div className={styles.glanceValue}>{stat.value}</div>
            <div className={styles.glanceLabel}>{stat.label}</div>
            <div className={styles.glanceSub}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div className={styles.profileColumns}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
              System access
            </div>
            {integrations.map((item) => (
              <div key={item.id} className={styles.sysRow}>
                <div>
                  <div className={styles.sysName}>{item.name}</div>
                  <div className={styles.sysMeta}>{item.meta}</div>
                </div>
                <StatusBadge status="Connected" tone="approved" />
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
              Recent admin activity
            </div>
            <div className={styles.auditList}>
              {adminActivity.map((item) => (
                <div key={item.id} className={styles.auditItem}>
                  <span className={styles.auditDot} />
                  <div>
                    <div className={styles.auditText}>{item.text}</div>
                    <div className={styles.auditMeta}>{item.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.profileColumns}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 14 }}>
              Reporting line
            </div>
            {manager ? (
              <div className={styles.reportingRow}>
                <Avatar
                  userId={manager.id}
                  name={manager.name}
                  avatarUrl={manager.avatarUrl}
                  size={42}
                />
                <div>
                  <div className={styles.reportingName}>{manager.name}</div>
                  <div className={styles.reportingMeta}>{manager.jobTitle} · Line manager</div>
                </div>
              </div>
            ) : (
              <p className={styles.reportingMeta}>No line manager on record.</p>
            )}
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 14 }}>
              Recent feedback
            </div>
            <div className={styles.feedbackList}>
              {recentFeedback.map((item) => (
                <div key={item.id} className={styles.feedbackItem}>
                  <p className={styles.feedbackQuote}>“{item.quote}”</p>
                  <div className={styles.feedbackMeta}>
                    {item.author} · {item.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
