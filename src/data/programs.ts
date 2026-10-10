import { Program } from '../types';

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: 'stronglifts-5x5-classic',
    name: 'StrongLifts 5x5 (Classic Barbell)',
    nameSv: 'StrongLifts 5x5 (Klassisk Skivstång)',
    description: 'The proven linear progression strength program. Three compound barbell movements per workout, 3 days a week. Simple, brutal, and effective.',
    descriptionSv: 'Den beprövade linjära styrkeklassikern. Tre tunga basövningar per pass, alternera pass A och B. Enkelt, tidseffektivt och ger garanterade resultat.',
    cycleType: 'ab_alternating',
    workouts: [
      {
        id: 'workout-a',
        name: 'Workout A',
        nameSv: 'Pass A (Böj, Bänk, Rodd)',
        dayTag: 'A',
        exerciseIds: ['barbell-squat', 'barbell-bench', 'barbell-row'],
        targetSets: 5,
        targetReps: 5,
      },
      {
        id: 'workout-b',
        name: 'Workout B',
        nameSv: 'Pass B (Böj, Press, Marklyft)',
        dayTag: 'B',
        exerciseIds: ['barbell-squat', 'overhead-press', 'deadlift'],
        targetSets: 5,
        targetReps: 5,
        customSetOverrides: {
          deadlift: { sets: 1, reps: 5 }, // StrongLifts standard is 1 heavy work set of Deadlifts
        },
      },
    ],
  },

  {
    id: 'stronglifts-5x5-flexible',
    name: '5x5 Flexible (Barbell & Dumbbells)',
    nameSv: '5x5 Flexibel (Skivstång & Hantlar)',
    description: 'Same 5x5 principles but pre-tuned with dumbbell alternatives for crowded gyms or home setups.',
    descriptionSv: 'Samma 5x5-principer med smart blandning av skivstång och hantlar när racket är upptaget eller för hemmaträning.',
    cycleType: 'ab_alternating',
    workouts: [
      {
        id: 'flex-a',
        name: 'Workout A',
        nameSv: 'Pass A (Knäböj, Hantelpress, Hantelrodd)',
        dayTag: 'A',
        exerciseIds: ['barbell-squat', 'dumbbell-bench', 'dumbbell-row'],
        targetSets: 5,
        targetReps: 5,
      },
      {
        id: 'flex-b',
        name: 'Workout B',
        nameSv: 'Pass B (Knäböj, Hantelaxlar, RDL)',
        dayTag: 'B',
        exerciseIds: ['barbell-squat', 'seated-dumbbell-press', 'romanian-deadlift'],
        targetSets: 5,
        targetReps: 5,
        customSetOverrides: {
          'romanian-deadlift': { sets: 3, reps: 8 },
        },
      },
    ],
  },

  {
    id: 'dumbbell-fullbody-partner',
    name: 'Full Body Dumbbells (Home & Partner Friendly)',
    nameSv: 'Helkropp Hantlar (Hemma & Partner-vänligt)',
    description: 'Full body routine requiring only dumbbells and a bench. Extremely accessible, kind on joints, and great for partners working out together.',
    descriptionSv: 'Effektiv helkroppsträning med bara hantlar och bänk. Skonsamt för lederna, lätt att köra tillsammans och perfekt hemma eller på gymmet.',
    cycleType: 'ab_alternating',
    workouts: [
      {
        id: 'partner-a',
        name: 'Workout A (Quads & Upper Push/Pull)',
        nameSv: 'Pass A (Goblet Squat, Press, Rodd)',
        dayTag: 'A',
        exerciseIds: ['goblet-squat', 'dumbbell-bench', 'dumbbell-row', 'bicep-curls'],
        targetSets: 3,
        targetReps: 8,
      },
      {
        id: 'partner-b',
        name: 'Workout B (Hamstrings & Shoulders)',
        nameSv: 'Pass B (RDL Hantlar, Axlar, Chins, Utsida)',
        dayTag: 'B',
        exerciseIds: ['dumbbell-rdl', 'seated-dumbbell-press', 'pull-ups', 'lateral-raises'],
        targetSets: 3,
        targetReps: 8,
      },
    ],
  },

  {
    id: 'upper-lower-4day',
    name: 'Upper / Lower 4-Day Strength',
    nameSv: 'Överkropp / Underkropp (4-Dagars)',
    description: 'Classic 4-day split: Upper body on Monday/Thursday, Lower body on Tuesday/Friday. Balanced strength & hypertrophy.',
    descriptionSv: 'Klassisk 4-dagars split: Överkropp mån/tors, Underkropp tis/fre. Perfekt balans mellan styrka och muskeluppbyggnad.',
    cycleType: 'linear_split',
    workouts: [
      {
        id: 'ul-upper-1',
        name: 'Upper Body A',
        nameSv: 'Överkropp A (Bänk & Rodd)',
        dayTag: 'Upper A',
        exerciseIds: ['barbell-bench', 'barbell-row', 'seated-dumbbell-press', 'bicep-curls'],
        targetSets: 4,
        targetReps: 6,
      },
      {
        id: 'ul-lower-1',
        name: 'Lower Body A',
        nameSv: 'Underkropp A (Knäböj & Tillägg)',
        dayTag: 'Lower A',
        exerciseIds: ['barbell-squat', 'romanian-deadlift', 'goblet-squat'],
        targetSets: 4,
        targetReps: 6,
      },
      {
        id: 'ul-upper-2',
        name: 'Upper Body B',
        nameSv: 'Överkropp B (Militärpress & Chins)',
        dayTag: 'Upper B',
        exerciseIds: ['overhead-press', 'pull-ups', 'incline-dumbbell-bench', 'dips'],
        targetSets: 4,
        targetReps: 8,
      },
      {
        id: 'ul-lower-2',
        name: 'Lower Body B',
        nameSv: 'Underkropp B (Marklyft & Frontböj)',
        dayTag: 'Lower B',
        exerciseIds: ['deadlift', 'front-squat', 'dumbbell-rdl'],
        targetSets: 4,
        targetReps: 6,
      },
    ],
  },
];
