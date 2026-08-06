import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/Components/ui/Modal';
import { Icon } from '@/Components/icons/Icon';
import { accentColour } from '@/Components/ui/accent';
import type { User } from '@/Types/domain';
import { eventAccent, type MeetingType } from './useCalendar';
import styles from './Calendar.module.css';

const meetingTypes: { id: MeetingType; name: string }[] = [
  { id: 'checkin', name: '1:1 check-in' },
  { id: 'review', name: 'Goal review meeting' },
  { id: 'appraisal', name: 'Appraisal discussion' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  attendees: User[];
  scheduling: boolean;
  onSchedule: (input: {
    title: string;
    type: MeetingType;
    date: string;
    time: string;
    attendeeIds: string[];
    reminderEnabled: boolean;
  }) => Promise<boolean>;
}

export function ScheduleMeetingModal({ open, onClose, attendees, scheduling, onSchedule }: Props) {
  const [type, setType] = useState<MeetingType>('checkin');
  const [attendeeId, setAttendeeId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('15:00');
  const [reminder, setReminder] = useState(true);
  const [done, setDone] = useState(false);

  // Default the attendee to the first person offered (usually the line manager)
  // so the form opens pre-filled, matching how the design presents it.
  useEffect(() => {
    if (open && !attendeeId && attendees.length > 0) setAttendeeId(attendees[0].id);
  }, [open, attendeeId, attendees]);

  const close = () => {
    setDone(false);
    onClose();
  };

  const confirm = async () => {
    const meeting = meetingTypes.find((m) => m.id === type) ?? meetingTypes[0];
    const ok = await onSchedule({
      title: meeting.name,
      type,
      date,
      time,
      attendeeIds: attendeeId ? [attendeeId] : [],
      reminderEnabled: reminder,
    });
    if (ok) setDone(true);
  };

  return (
    <Modal open={open} onClose={close} label="Schedule meeting" width={520}>
      {done ? (
        <div className={styles.doneState}>
          <div className={styles.doneMark}>
            <Icon name="check" size={36} />
          </div>
          <div className={styles.doneTitle}>Meeting scheduled</div>
          <p className={styles.doneText}>
            The invite is on its way via Outlook, and a reminder is set. It's now on your calendar.
          </p>
          <button type="button" className={styles.doneButton} onClick={close}>
            Done
          </button>
        </div>
      ) : (
        <>
          <div className={styles.modalHead}>
            <h2 className={styles.modalTitle}>Schedule meeting</h2>
            <button type="button" className={styles.closeButton} onClick={close} aria-label="Close">
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className={styles.fieldLabel}>Meeting type</div>
          <div className={styles.typeList}>
            {meetingTypes.map((meeting) => {
              const selected = type === meeting.id;
              return (
                <button
                  key={meeting.id}
                  type="button"
                  className={styles.typeOption}
                  data-on={selected}
                  onClick={() => setType(meeting.id)}
                >
                  <span className={styles.radio} data-on={selected} />
                  <span
                    className={styles.typeSwatch}
                    style={{ background: accentColour[eventAccent[meeting.id]] }}
                  />
                  <span className={styles.typeName}>{meeting.name}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.fieldLabel}>Attendee</div>
          <select
            className={styles.select}
            value={attendeeId}
            onChange={(event) => setAttendeeId(event.target.value)}
          >
            <option value="">Select an attendee</option>
            {attendees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.jobTitle ? `${user.name} (${user.jobTitle})` : user.name}
              </option>
            ))}
          </select>

          <div className={styles.dateRow}>
            <div style={{ flex: 1 }}>
              <div className={styles.fieldLabel}>Date</div>
              <input
                type="date"
                className={styles.input}
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className={styles.fieldLabel}>Time</div>
              <input
                type="time"
                className={styles.input}
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.reminderToggle}
            onClick={() => setReminder((v) => !v)}
            aria-pressed={reminder}
          >
            <span className={styles.switch} data-on={reminder}>
              <span className={styles.switchKnob} />
            </span>
            <span>
              Send in-app + email reminder <strong>15 min before</strong>
            </span>
          </button>

          <button type="button" className={styles.submit} onClick={confirm} disabled={scheduling}>
            {scheduling ? 'Sending invite' : 'Send invite & add to calendar'}
          </button>
        </>
      )}
    </Modal>
  );
}
