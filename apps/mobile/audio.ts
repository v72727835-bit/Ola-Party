export type AudioConnection = { disconnect: () => Promise<void>; setMicrophone: (enabled: boolean) => Promise<void> };
export async function connectAudio(_url: string, _token: string, _onDisconnected: () => void): Promise<AudioConnection> {
  throw new Error('Live audio on Android/iOS requires a custom development build with the LiveKit native SDK. Use the browser preview for the working web audio adapter.');
}
