import { create } from "zustand";

const useChatStore = create((set) => ({
  role: null,
  name: "",
  messages: [],
  users: [],
  typingUsers: {},
  setRole: (role) => set({ role }),
  setName: (name) => set({ name }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setUsers: (users) => set({ users }),
  setTypingUser: (userId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    })),
  reset: () =>
    set({ role: null, name: "", messages: [], users: [], typingUsers: {} }),
}));

export default useChatStore;
