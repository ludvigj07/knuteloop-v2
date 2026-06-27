import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Camera, Image as ImageIcon, X } from 'lucide-react-native'
import { Pressable, StickerButton, Text } from '../primitives'
import { size, sticker, spacing } from '../../lib/theme'

// The photo "bevis" area of the Send inn flow. Three states:
//  - empty   → a dashed sticker "well" (camera-first) + a gallery button
//  - picked  → the compressed photo in a bordered frame with a remove (X) control
//  - locked  → controls hidden (the user already submitted this knute)
// Camera-first because a knute submission is "prove it" — but gallery stays one tap away.

type PhotoEvidenceProps = {
  imageUri: string | null
  /** True while a photo is being picked / compressed — disables the actions. */
  picking: boolean
  /** True when the form is locked (a prior submission exists) — hides all controls. */
  disabled: boolean
  onPickCamera: () => void
  onPickLibrary: () => void
  onRemove: () => void
}

export function PhotoEvidence({
  imageUri,
  picking,
  disabled,
  onPickCamera,
  onPickLibrary,
  onRemove,
}: PhotoEvidenceProps) {
  if (imageUri) {
    return (
      <View style={styles.wrap}>
        <View style={styles.frame}>
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
            contentFit="cover"
            transition={150}
            accessibilityRole="image"
            accessibilityLabel="Valgt bilde"
          />
          {!disabled ? (
            <Pressable
              onPress={onRemove}
              haptic="medium"
              accessibilityLabel="Fjern bilde"
              accessibilityHint="Fjerner bildet så du kan velge et nytt."
              style={styles.removeBtn}
            >
              <X size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>
        {!disabled ? (
          <StickerButton
            label="Bytt bilde"
            variant="secondary"
            size="sm"
            icon={<ImageIcon size={sticker.icon.sm} color={sticker.color.ink} strokeWidth={2} />}
            onPress={onPickLibrary}
            disabled={picking}
            fullWidth
          />
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPickCamera}
        disabled={disabled || picking}
        haptic="medium"
        accessibilityLabel="Ta bilde med kamera"
        accessibilityHint="Åpner kameraet for å ta bilde av knuten."
        style={styles.well}
      >
        <Camera size={sticker.icon.lg} color={sticker.color.primary} strokeWidth={2} />
        <Text font="display" weight="bold" size="base" color={sticker.color.ink}>
          Ta bilde
        </Text>
        <Text size="xs" color={sticker.color.textMuted}>
          Knipsen blir beviset ditt
        </Text>
      </Pressable>
      <StickerButton
        label="Velg fra galleri"
        variant="secondary"
        icon={<ImageIcon size={sticker.icon.md} color={sticker.color.ink} strokeWidth={2} />}
        onPress={onPickLibrary}
        disabled={disabled || picking}
        fullWidth
      />
      {picking ? (
        <Text size="sm" color={sticker.color.textMuted} align="center">
          Behandler bilde…
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  frame: {
    position: 'relative',
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    borderRadius: sticker.radius.lg,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: size.emptyMinHeight,
    backgroundColor: sticker.color.surfaceMedia,
  },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: size.actionMinHeight,
    height: size.actionMinHeight,
    borderRadius: sticker.radius.full,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.ink,
    backgroundColor: sticker.color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  well: {
    minHeight: size.emptyMinHeight,
    borderRadius: sticker.radius.lg,
    borderWidth: sticker.borderWidth,
    borderColor: sticker.color.lineStrong,
    borderStyle: 'dashed',
    backgroundColor: sticker.color.surfaceMedia,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
  },
})
