import { Room, RoomEvent, Track } from 'livekit-client';
export type AudioConnection = { disconnect: () => Promise<void>; setMicrophone: (enabled: boolean) => Promise<void> };
export async function connectAudio(url: string, token: string, onDisconnected: () => void): Promise<AudioConnection> {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const audio = new Set<HTMLMediaElement>();
  room.on(RoomEvent.TrackSubscribed, track => {
    if (track.kind !== Track.Kind.Audio) return;
    const element = track.attach(); element.style.display = 'none'; document.body.appendChild(element); audio.add(element);
  });
  room.on(RoomEvent.TrackUnsubscribed, track => { track.detach().forEach(element => { audio.delete(element); element.remove(); }); });
  const cleanup = () => { audio.forEach(element => element.remove()); audio.clear(); };
  room.on(RoomEvent.Disconnected, () => { cleanup(); onDisconnected(); });
  try { await room.connect(url, token); await room.startAudio(); }
  catch (error) { cleanup(); await room.disconnect(); throw error; }
  return {
    disconnect: async () => { await room.disconnect(); cleanup(); },
    setMicrophone: async enabled => { await room.localParticipant.setMicrophoneEnabled(enabled); },
  };
}
