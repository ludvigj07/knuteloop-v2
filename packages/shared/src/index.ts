export type UserRole = 'student' | 'knutesjef' | 'admin'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export const APP_NAME = 'Knuteloop'

// Folder icon keys — the fixed picker set, shared by the API (validation) and the
// mobile app (the picker + rendering) so the two can never drift. Each key maps
// to a lucide icon on the client (see apps/mobile/lib/folder-icons.ts).
export const FOLDER_ICON_KEYS = [
  'folder',
  'dumbbell',
  'utensils',
  'music',
  'star',
  'heart',
  'trophy',
  'camera',
] as const

export type FolderIconKey = (typeof FOLDER_ICON_KEYS)[number]
