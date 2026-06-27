import {
  Camera,
  Dumbbell,
  Folder,
  Heart,
  Music,
  Star,
  Trophy,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native'
import { FOLDER_ICON_KEYS, type FolderIconKey } from '@knuteloop/shared'

// Maps the shared folder-icon keys to lucide components. The picker (CreateFolderSheet)
// and the folder rows both render through here, so the set stays in sync with the
// API's validation (FOLDER_ICON_KEYS in @knuteloop/shared).

const ICONS: Record<FolderIconKey, LucideIcon> = {
  folder: Folder,
  dumbbell: Dumbbell,
  utensils: Utensils,
  music: Music,
  star: Star,
  heart: Heart,
  trophy: Trophy,
  camera: Camera,
}

/** The ordered key list for the picker grid. */
export const folderIconKeys = FOLDER_ICON_KEYS

/** Resolve a stored icon key (or null) to a lucide component; falls back to Folder. */
export function folderIconFor(key: string | null | undefined): LucideIcon {
  if (key && key in ICONS) return ICONS[key as FolderIconKey]
  return Folder
}
