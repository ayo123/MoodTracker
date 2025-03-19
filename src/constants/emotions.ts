// Default list of emotions that users can select from when tracking mood

export const defaultEmotions = [
  { id: 1, name: 'Happy' },
  { id: 2, name: 'Sad' },
  { id: 3, name: 'Anxious' },
  { id: 4, name: 'Calm' },
  { id: 5, name: 'Frustrated' },
  { id: 6, name: 'Excited' },
  { id: 7, name: 'Tired' },
  { id: 8, name: 'Energetic' },
  { id: 9, name: 'Angry' },
  { id: 10, name: 'Content' },
  { id: 11, name: 'Bored' },
  { id: 12, name: 'Optimistic' },
  { id: 13, name: 'Pessimistic' },
  { id: 14, name: 'Confused' },
  { id: 15, name: 'Confident' },
  { id: 16, name: 'Overwhelmed' },
  { id: 17, name: 'Hopeful' },
  { id: 18, name: 'Grateful' },
  { id: 19, name: 'Lonely' },
  { id: 20, name: 'Loved' },
];

// Extended set with more granular emotions
export const extendedEmotions = [
  ...defaultEmotions,
  { id: 21, name: 'Restless' },
  { id: 22, name: 'Relaxed' },
  { id: 23, name: 'Focused' },
  { id: 24, name: 'Distracted' },
  { id: 25, name: 'Irritated' },
  { id: 26, name: 'Peaceful' },
  { id: 27, name: 'Motivated' },
  { id: 28, name: 'Unmotivated' },
  { id: 29, name: 'Stressed' },
  { id: 30, name: 'Relieved' },
];

// Map emotions to categories
export const emotionCategories = {
  positive: [1, 4, 6, 8, 10, 12, 15, 17, 18, 20],
  negative: [2, 3, 5, 7, 9, 11, 13, 14, 16, 19],
}; 