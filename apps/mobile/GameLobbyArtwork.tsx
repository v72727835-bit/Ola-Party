import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Shared native/WebGL fallback: no textures, downloads or animation loop.
export default function GameLobbyArtwork() {
  return <View accessible accessibilityLabel="Game lounge illustration with dice and playing cards" style={styles.art}>
    <View style={[styles.orbit, { width: 230, height: 230 }]} />
    <View style={[styles.orbit, { width: 170, height: 170 }]} />
    <View style={styles.card}><Text style={styles.cardNumber}>7</Text><MaterialCommunityIcons name="cards-outline" color="#c6b6ff" size={44} /></View>
    <View style={styles.die}><MaterialCommunityIcons name="dice-5" color="#171525" size={75} /></View>
    <View style={styles.spark} />
  </View>;
}
const styles = StyleSheet.create({
  art: { height: 190, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  orbit: { position: 'absolute', borderRadius: 200, borderWidth: 1, borderColor: '#a78bfa24', transform: [{ scaleY: .48 }, { rotate: '-20deg' }] },
  card: { width: 78, height: 114, backgroundColor: '#30234b', borderRadius: 16, borderWidth: 1, borderColor: '#a78bfa77', position: 'absolute', left: '54%', top: 23, padding: 12, transform: [{ rotate: '17deg' }] },
  cardNumber: { color: '#c6b6ff', fontSize: 22, fontWeight: '800' },
  die: { width: 92, height: 92, borderRadius: 24, backgroundColor: '#ede6d7', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-14deg' }], marginRight: 38, marginTop: 35 },
  spark: { position: 'absolute', width: 7, height: 7, borderRadius: 7, backgroundColor: '#6ee7c4', right: '22%', bottom: 34 },
});
