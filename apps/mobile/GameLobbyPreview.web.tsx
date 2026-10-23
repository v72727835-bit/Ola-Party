import '@expo/metro-runtime';
import React, { Component, lazy, Suspense, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import GameLobbyArtwork from './GameLobbyArtwork';

const Scene = lazy(() => import('./GameLobbyScene'));
class SceneBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <><GameLobbyArtwork /><Text style={{ color: '#bcb4cf', textAlign: 'center' }}>3D unavailable. Lounge preview shown.</Text></> : this.props.children; }
}
export default function GameLobbyPreview() {
  const [enabled, setEnabled] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setReduced(media.matches); if (media.matches) setEnabled(false); };
    update(); media.addEventListener('change', update);
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    setAvailable(!!gl); gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return () => media.removeEventListener('change', update);
  }, []);
  return <View>
    {enabled && !reduced ? <SceneBoundary><Suspense fallback={<GameLobbyArtwork />}><Scene /></Suspense></SceneBoundary> : <GameLobbyArtwork />}
    {available && !reduced && <Pressable accessibilityRole="button" accessibilityLabel={enabled ? 'Close 3D preview' : 'Explore 3D lounge preview'} onPress={() => setEnabled(v => !v)} style={({ pressed }) => ({ alignSelf: 'center', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: pressed ? '#46345f' : '#2a213d', borderWidth: 1, borderColor: '#a78bfa55', marginBottom: 12 })}><Text style={{ color: '#d6c9ff', fontSize: 12, fontWeight: '700' }}>{enabled ? 'Back to artwork' : 'Explore in 3D'}</Text></Pressable>}
  </View>;
}
