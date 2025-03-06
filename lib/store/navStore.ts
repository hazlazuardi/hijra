import { create } from 'zustand'

type NavSection = 'dashboard' | 'prayer' | 'fasting' | 'quran' | 'kultum'

interface NavState {
  activeSection: NavSection
  setActiveSection: (section: NavSection) => void
}

export const useNavStore = create<NavState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),
})) 