export type ViewMode = 'write' | 'read';
export type SortMode = 'newest' | 'random';

export type Person = {
  id: string;
  fullName: string;
  roomNo: string;
  photoUrl?: string | null;
};

export type Memory = {
  id: string | number;
  recipientId: string;
  authorId: string;
  authorName: string;
  message: string;
  createdAt: string;
};

export type CreateMemoryInput = {
  recipientId: string;
  authorId: string;
  authorName: string;
  message: string;
};
