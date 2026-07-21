import type { GoalCategory } from '@/types/domain';

// Per category guidance shown in the wizard's step header and its side pane.
// Copy is taken from the design with its en dashes rewritten.
interface CategoryCopy {
  headline: string;
  blurb: string;
  kicker: string;
  paneTitle: string;
  tips: string[];
}

export const categoryOrder: GoalCategory[] = ['Client', 'Company', 'People', 'Financial'];

export const categoryCopy: Record<GoalCategory, CategoryCopy> = {
  Client: {
    headline: 'What will make your clients thrive?',
    blurb:
      'Client value, on time high quality work, and the relationships that keep accounts healthy and growing.',
    kicker: 'Client focus',
    paneTitle: 'Obsess over client value.',
    tips: [
      'Aim for measurable outcomes, for example a monthly report by the 5th',
      'One goal here can be a stretch goal',
      'Weighting suggestion, around 30 percent',
    ],
  },
  Company: {
    headline: 'How will you strengthen the company?',
    blurb:
      'Culture, innovation and reputation: case studies, pitches, thought leadership and living the values.',
    kicker: 'Company focus',
    paneTitle: 'Grow our capability and reputation.',
    tips: [
      'Think case studies, pitches, media landscape',
      'Contribute to the collective, not just your desk',
      'Weighting suggestion, around 20 percent',
    ],
  },
  People: {
    headline: 'How will you lift the people around you?',
    blurb:
      'High performing, inclusive teams: mentoring, onboarding, training and your own development.',
    kicker: 'People focus',
    paneTitle: 'Build brilliant, diverse teams.',
    tips: [
      'Training sessions, onboarding, mentoring',
      'Include your own development too',
      'Weighting suggestion, around 30 percent',
    ],
  },
  Financial: {
    headline: 'How will you drive commercial value?',
    blurb:
      'Revenue growth, efficiency and data driven decisions: upselling, new business and smart operations.',
    kicker: 'Financial focus',
    paneTitle: 'Sharpen commercial acumen.',
    tips: [
      'Revenue growth, upselling, cross selling',
      'Operational efficiency counts too',
      'Weighting suggestion, around 20 percent',
    ],
  },
};
