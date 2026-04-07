import type { Memory, Person } from '../../lib/utils/types';

export const MOCK_PEOPLE: Person[] = Array.from({ length: 8 }, (_, index) => ({
  id: `mock-person-${index + 1}`,
  fullName: `Batchmate ${index + 1}`,
  roomNo: `${200 + index}`,
  photoUrl: index % 3 === 0 ? null : `https://picsum.photos/seed/yearbook-v2-${index + 1}/300/300`,
}));

export const MOCK_MEMORIES: Memory[] = [
  {
    id: 'mock-memory-1',
    recipientId: 'mock-person-1',
    authorId: 'mock-person-2',
    authorName: 'Batchmate 2',
    message: 'Your calmness turned every deadline into something we could actually finish.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-memory-2',
    recipientId: 'mock-person-1',
    authorId: 'mock-person-4',
    authorName: 'Batchmate 4',
    message: 'Room 201 was louder and better whenever you walked in.',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
];
