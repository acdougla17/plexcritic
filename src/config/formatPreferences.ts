/**
 * Defines which video codecs / containers count as "acceptable" for your
 * library. Anything outside these sets is treated as a transcode candidate.
 * Audio-only rows (empty videoCodec) are ignored by candidate queries.
 */
export type FormatPreferences = {
  acceptableVideoCodecs: string[]
  acceptableContainers: string[]
  acceptableResolutions: string[]
}

export const defaultFormatPreferences: FormatPreferences = {
  acceptableVideoCodecs: ['hevc', 'h265', 'av1'],
  acceptableContainers: ['mkv', 'mp4'],
  acceptableResolutions: ['720', '1080', '4k', '2160'],
}

export function getFormatPreferences(): FormatPreferences {
  return {
    acceptableVideoCodecs: [...defaultFormatPreferences.acceptableVideoCodecs],
    acceptableContainers: [...defaultFormatPreferences.acceptableContainers],
    acceptableResolutions: [...defaultFormatPreferences.acceptableResolutions],
  }
}

/**
 * A file needs conversion when it has a video codec and either the codec
 * or the container is outside the acceptable sets. Resolution is reported
 * in summaries but does not alone force candidacy (many libraries keep
 * SD archives on purpose).
 */
export function needsTranscode(
  videoCodec: string | null | undefined,
  container: string | null | undefined,
  preferences: FormatPreferences = getFormatPreferences(),
): boolean {
  const codec: string = (videoCodec ?? '').trim().toLowerCase()
  if (codec.length === 0) {
    return false
  }

  const cont: string = (container ?? '').trim().toLowerCase()
  const codecOk: boolean = preferences.acceptableVideoCodecs.some(
    (c: string) => c.toLowerCase() === codec,
  )
  const containerOk: boolean =
    cont.length === 0 ||
    preferences.acceptableContainers.some((c: string) => c.toLowerCase() === cont)

  return !codecOk || !containerOk
}
