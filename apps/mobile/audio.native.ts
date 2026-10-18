import Constants from 'expo-constants';
export type AudioConnection = { disconnect: () => Promise<void>; setMicrophone: (enabled: boolean) => Promise<void> };
let registered = false;
export async function connectAudio(url: string, token: string, onDisconnected: () => void): Promise<AudioConnection> {
  if (Constants.executionEnvironment === 'storeClient') throw new Error('Live audio needs the Party App development build; Expo Go does not include WebRTC. Run an Android/iOS development build or use the web preview.');
  const { AudioSession, registerGlobals } = await import('@livekit/react-native');
  if (!registered) { registerGlobals(); registered = true; }
  const { Room, RoomEvent } = await import('livekit-client');
  const room = new Room({ adaptiveStream: true, dynacast: true });
  await AudioSession.startAudioSession();
  let stopped = false;
  const cleanup = async () => { if (stopped) return; stopped = true; await AudioSession.stopAudioSession(); };
  room.on(RoomEvent.Disconnected, () => { void cleanup(); onDisconnected(); });
  try { await room.connect(url, token); }
  catch (error) { await room.disconnect(); await cleanup(); throw error; }
  return {
    disconnect: async () => { await room.disconnect(); await cleanup(); },
    setMicrophone: async enabled => { await room.localParticipant.setMicrophoneEnabled(enabled); },
  };
}
