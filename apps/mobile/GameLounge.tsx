import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameLobbyPreview from './GameLobbyPreview';

export default function GameLounge({ roomTitle, members }: { roomTitle?: string; members: number }) {
  return <View style={s.hero}>
    <View style={s.top}><Text style={s.kicker}>THE GAME LOUNGE</Text><View style={s.pill}><View style={s.dot} /><Text style={s.pillText}>{members} in room</Text></View></View>
    <Text accessibilityRole="header" style={s.title}>Good company.{'\n'}One more game.</Text>
    <Text style={s.copy}>{roomTitle ? `Play together in ${roomTitle}.` : 'Join a room to play with friends.'} Pick your favourite below.</Text>
    <GameLobbyPreview />
    <View style={s.footer}><Text style={s.note}>4 games · made for friends</Text><Text style={s.note}>No betting</Text></View>
  </View>;
}
const s = StyleSheet.create({
  hero: { backgroundColor: '#181321', borderRadius: 24, padding: 20, marginBottom: 6, borderWidth: 1, borderColor: '#b49bff25', overflow: 'hidden' },
  top: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: '#b7a0e1', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  pill: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#6ee7c411', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  dot: { width: 5, height: 5, borderRadius: 5, backgroundColor: '#6ee7c4' },
  pillText: { color: '#9ed7c9', fontSize: 10, fontWeight: '700' },
  title: { color: '#f3eee7', fontSize: 31, lineHeight: 37, letterSpacing: -1, fontWeight: '800', marginTop: 21 },
  copy: { color: '#aaa1b8', fontSize: 13, lineHeight: 21, marginTop: 12, maxWidth: 340 },
  footer: { borderTopWidth: 1, borderColor: '#ffffff12', paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  note: { color: '#a89ab9', fontSize: 10 },
});
