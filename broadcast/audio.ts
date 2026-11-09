let context: AudioContext | undefined;
export async function enableAudio() {
  context ??= new AudioContext();
  await context.resume();
}
export function chime(hz: number, volume: number) {
  if (!context || context.state !== "running") return;
  const oscillator = context.createOscillator(),
    gain = context.createGain();
  oscillator.frequency.value = hz;
  gain.gain.setValueAtTime(
    Math.min(1, volume / 100) * 0.1,
    context.currentTime,
  );
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.26);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
