/**
 * 书籍状态管理
 */
import { create } from 'zustand';
import type { Book } from '@shared/types';

interface BookState {
  // 书籍列表
  books: Book[];
  currentBook: Book | null;

  // 筛选和排序
  filterTags: string[];
  sortBy: 'title' | 'author' | 'lastReadAt' | 'addedAt';
  sortOrder: 'asc' | 'desc';

  // 操作
  setBooks: (books: Book[]) => void;
  setCurrentBook: (book: Book | null) => void;
  addBook: (book: Book) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  setFilterTags: (tags: string[]) => void;
  setSortBy: (sortBy: BookState['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export const useBookStore = create<BookState>((set) => ({
  // 初始状态
  books: [],
  currentBook: null,
  filterTags: [],
  sortBy: 'lastReadAt',
  sortOrder: 'desc',

  // 操作
  setBooks: (books) => set({ books }),
  setCurrentBook: (book) => set({ currentBook: book }),
  addBook: (book) => set((state) => ({ books: [...state.books, book] })),
  updateBook: (id, updates) =>
    set((state) => ({
      books: state.books.map((book) => (book.id === id ? { ...book, ...updates } : book)),
    })),
  deleteBook: (id) => set((state) => ({ books: state.books.filter((book) => book.id !== id) })),
  setFilterTags: (tags) => set({ filterTags: tags }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (order) => set({ sortOrder: order }),
}));
