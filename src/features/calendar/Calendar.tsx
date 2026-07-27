import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Icon } from '@/components/icons/Icon';
import { accentColour } from '@/components/ui/accent';
import { ErrorState } from '@/components/ui/States';
import { ViewSkeleton } from '@/components/ui/Skeleton';
import type { Accent } from '@/api/schemas/dashboard';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { eventAccent, useCalendar } from './useCalendar';
import styles from './Calendar.module.css';

const chipTint: Record<Accent, { bg: string; fg: string }> = {
  teal: { bg: 'var(--status-approved-bg)', fg: 'var(--status-approved-fg)' },
  blue: { bg: 'var(--status-submitted-bg)', fg: 'var(--status-submitted-fg)' },
  gold: { bg: 'var(--status-review-bg)', fg: 'var(--status-review-fg)' },
  orange: { bg: 'var(--status-returned-bg)', fg: 'var(--status-returned-fg)' },
  ink: { bg: 'var(--status-neutral-bg)', fg: 'var(--status-neutral-fg)' },
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Calendar() {
  const calendar = useCalendar();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (calendar.isPending) return <ViewSkeleton />;
  if (calendar.isError) {
    return (
      <div className={`view ${styles.page}`}>
        <ErrorState error={calendar.error} onRetry={calendar.refetch} />
      </div>
    );
  }

  return (
    <div className={`view ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendar</h1>
          <p className={styles.subtitle}>
            Cycle milestones, check-ins and review meetings, synced with Outlook.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.syncPill}>
            <span className={styles.syncDot} />
            Outlook synced
          </span>
          <button type="button" className={styles.scheduleButton} onClick={() => setScheduleOpen(true)}>
            <Icon name="plus" size={15} />
            Schedule meeting
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={`card ${styles.gridCard}`}>
          <div className={styles.gridHead}>
            <div className={styles.monthLabel}>{calendar.monthLabel}</div>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={styles.viewOption}
                data-on={calendar.view === 'month'}
                onClick={() => calendar.setView('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={styles.viewOption}
                data-on={calendar.view === 'week'}
                onClick={() => calendar.setView('week')}
              >
                Week
              </button>
            </div>
            <div className={styles.navButtons}>
              <button
                type="button"
                className={styles.navButton}
                onClick={calendar.prevMonth}
                aria-label="Previous month"
              >
                <Icon name="chevronLeft" size={15} />
              </button>
              <button
                type="button"
                className={styles.navButton}
                onClick={calendar.nextMonth}
                aria-label="Next month"
              >
                <Icon name="chevronRight" size={15} />
              </button>
            </div>
          </div>

          <div className={styles.dow}>
            {dayNames.map((name) => (
              <div key={name} className={styles.dowCell}>
                {name}
              </div>
            ))}
          </div>

          <div className={styles.grid}>
            {calendar.days.map((cell, index) => (
              <div
                key={index}
                className={styles.day}
                data-blank={!cell.inMonth}
                data-today={cell.isToday}
              >
                {cell.inMonth && (
                  <>
                    <div className={styles.dayNum}>{cell.date.getDate()}</div>
                    <div className={styles.dayEvents}>
                      {cell.events.map((event) => {
                        const tint = chipTint[eventAccent[event.type]];
                        return (
                          <div
                            key={event.id}
                            className={styles.eventChip}
                            style={{ background: tint.bg, color: tint.fg }}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.side}>
          <div className={`card ${styles.sideCard}`}>
            <div className={styles.sideTitle}>Cycle milestones</div>
            {calendar.milestones.length === 0 && (
              <div className={styles.emptyNote}>No milestones this month.</div>
            )}
            {calendar.milestones.map((event, index) => {
              const colour = accentColour[eventAccent[event.type]];
              return (
                <div key={event.id} className={styles.milestone}>
                  <div className={styles.milestoneRail}>
                    <span
                      className={styles.milestoneDot}
                      style={{ background: colour, boxShadow: `0 0 0 3px ${chipTint[eventAccent[event.type]].bg}` }}
                    />
                    {index < calendar.milestones.length - 1 && (
                      <span className={styles.milestoneLine} />
                    )}
                  </div>
                  <div>
                    <div className={styles.milestoneTitle}>{event.title}</div>
                    <div className={styles.milestoneDate}>
                      {format(parseISO(event.startsAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`card ${styles.sideCard}`}>
            <div className={styles.sideTitle}>Upcoming</div>
            {calendar.upcoming.length === 0 && (
              <div className={styles.emptyNote}>Nothing scheduled yet. Book a meeting to start.</div>
            )}
            {calendar.upcoming.map((event) => {
              const accent = eventAccent[event.type];
              const start = parseISO(event.startsAt);
              return (
                <div
                  key={event.id}
                  className={styles.upcoming}
                  style={{ background: chipTint[accent].bg }}
                >
                  <div className={styles.upcomingDate}>
                    <div className={styles.upcomingDay} style={{ color: accentColour[accent] }}>
                      {format(start, 'd')}
                    </div>
                    <div className={styles.upcomingMon}>{format(start, 'MMM').toUpperCase()}</div>
                  </div>
                  <div className={styles.upcomingBody}>
                    <div className={styles.upcomingTitle}>{event.title}</div>
                    <div className={styles.upcomingMeta}>{format(start, 'h:mm a')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        attendees={calendar.attendees}
        scheduling={calendar.scheduling}
        onSchedule={calendar.schedule}
      />
    </div>
  );
}
