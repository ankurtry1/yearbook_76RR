import type { Memoir, Person } from '../../lib/utils/types';
export const MOCK_ROSTER: Person[] = Array.from({ length: 16 }, (_, i) => ({
  id: `person-${i + 1}`,
  email: `batchmate${i + 1}@example.com`,
  nickname: `Nick ${i + 1}`,
  fullName: `Batchmate ${i + 1}`,
  roomNo: `${100 + i}`,
  hasPhoto: i % 5 !== 0,
  photoUrl: i % 5 !== 0 ? `https://picsum.photos/seed/yearbook-${i + 1}/300/300` : undefined,
}));
export const MOCK_MEMOIRS: Memoir[] = [
  { id: 'm1', recipientId: 'person-1', senderId: 'person-2', senderDisplayName: 'Nick 2', senderPhotoUrl: 'https://picsum.photos/seed/yearbook-2/300/300', isAnonymous: false, text: 'You made chaos feel organized, which is a disturbing talent and somehow deeply comforting.', createdAt: new Date().toISOString(), isRead: false, reactions: { love: 5, laugh: 2, emotional: 1, anchored: 0 } },
  { id: 'm2', recipientId: 'person-1', senderId: null, senderDisplayName: 'Anonymous', isAnonymous: true, text: 'You are one of the few people who make a room quieter without saying anything.', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), isRead: true, reactions: { love: 3, laugh: 0, emotional: 4, anchored: 1 } },
  { id: 'm3', recipientId: 'person-1', senderId: 'person-3', senderDisplayName: 'Nick 3', senderPhotoUrl: 'https://picsum.photos/seed/yearbook-3/300/300', isAnonymous: false, text: 'I will always remember how you made even routine days feel oddly cinematic.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: false, reactions: { love: 7, laugh: 1, emotional: 3, anchored: 2 } },
];
