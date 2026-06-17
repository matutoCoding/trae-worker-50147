import { create } from 'zustand';
import type { User, BorrowRecord } from '@/types/user';
import { mockCurrentUser, mockBorrowRecords } from '@/data/users';

interface UserState {
  currentUser: User;
  borrowRecords: BorrowRecord[];
  setCurrentUser: (user: User) => void;
  addBorrowRecord: (record: BorrowRecord) => void;
  updateBorrowRecord: (id: string, updates: Partial<BorrowRecord>) => void;
  getUserBorrowRecords: (userId: string) => BorrowRecord[];
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: mockCurrentUser,
  borrowRecords: mockBorrowRecords,

  setCurrentUser: (user) => {
    console.log('[UserStore] Setting current user:', user.name);
    set({ currentUser: user });
  },

  addBorrowRecord: (record) => {
    console.log('[UserStore] Adding borrow record:', record.equipmentName);
    set((state) => ({
      borrowRecords: [...state.borrowRecords, record]
    }));
  },

  updateBorrowRecord: (id, updates) => {
    console.log('[UserStore] Updating borrow record:', id);
    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
  },

  getUserBorrowRecords: (userId) => {
    return get().borrowRecords.filter((r) => r.borrowerId === userId);
  }
}));
