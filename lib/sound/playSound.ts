let currentAudio: HTMLAudioElement | null = null;

export function playSound(src: string, volume = 0.6) {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
    currentAudio = audio;
  } catch {
    // silent fail (important)
  }
}
