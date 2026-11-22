import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { c } from './src/theme';
import { s } from './src/styles';
import type { AppCtx } from './src/state/context';
import { useAppState } from './src/state/useAppState';
import { deriveApp } from './src/state/deriveApp';
import { renderHome } from './src/screens/HomeScreen';
import { renderExplore } from './src/screens/ExploreScreen';
import { renderMessages } from './src/screens/MessagesScreen';
import { renderMe } from './src/screens/MeScreen';
import { renderRoom } from './src/screens/RoomScreen';
import { makeAboutRows, makeHonorGrid } from './src/screens/ProfileParts';
import { renderDetail } from './src/screens/DetailPages';
import { renderAppShell } from './src/navigation/AppShell';

export default function App() { return <SafeAreaProvider><PartyApp /></SafeAreaProvider>; }

function PartyApp() {
  const app = useAppState();
  const { hydrated } = app;

  if (!hydrated) return <View style={[s.outer, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={c.brand} size="large" /></View>;

  const base = deriveApp(app);
  const ctx: AppCtx = { ...base, aboutRows: makeAboutRows(base), honorGrid: makeHonorGrid(base) };
  const homeScreen = renderHome(ctx);
  const exploreScreen = renderExplore(ctx);
  const messagesScreen = renderMessages(ctx);
  const meScreen = renderMe(ctx);
  const roomScreen = renderRoom(ctx);
  const detail = renderDetail(ctx);
  return renderAppShell(ctx, { homeScreen, exploreScreen, messagesScreen, meScreen, roomScreen, detail });
}
