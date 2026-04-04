export type ViewMode = 'write' | 'read';
export type SortMode = 'random' | 'unread' | 'newest';
export type Person = { id: string; email: string; nickname: string; fullName: string; roomNo?: string; photoUrl?: string; hasPhoto: boolean; };
export type Memoir = { id: string; recipientId: string; senderId: string | null; senderDisplayName: string; senderPhotoUrl?: string; isAnonymous: boolean; text: string; createdAt: string; isRead: boolean; reactions: Record<'love'|'laugh'|'emotional'|'anchored', number>; };
