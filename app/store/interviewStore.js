// app/store/interviewStore.js
import { create } from "zustand";

export const useInterviewStore = create((set) => ({
  questions: [],
  setQuestions: (newQuestions) => set({ questions: newQuestions }),
}));
