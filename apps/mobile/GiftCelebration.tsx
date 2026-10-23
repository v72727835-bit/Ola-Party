import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { GiftArtwork, giftMetadata } from './GiftDrawer';
type Row = Record<string, any>;

/** One short presentation per confirmed gift. Motion respects the device preference. */
export default function GiftCelebration({ gift }: { gift: Row | null }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!gift) return;
    progress.setValue(0);
    const motion = Animated.timing(progress, { toValue: 1, duration: reduceMotion ? 1500 : 2800, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' });
    motion.start();
    return () => motion.stop();
  }, [gift?.key, reduceMotion]);
  if (!gift) return null;
  const title = gift.customization?.label || gift.giftName || giftMetadata(gift.giftId)?.name || 'A little something';
  return <Animated.View pointerEvents="none" style={[s.wrap, { opacity: progress.interpolate({ inputRange: [0, .12, .78, 1], outputRange: [0, 1, 1, 0] }), transform: reduceMotion ? [] : [{ translateY: progress.interpolate({ inputRange: [0, .16, .8, 1], outputRange: [12, 0, 0, -8] }) }, { scale: progress.interpolate({ inputRange: [0, .16, 1], outputRange: [.96, 1, 1] }) }] }]}>
    <View style={s.card}>
      <View style={s.top}><Text style={s.sender} numberOfLines={1}>{gift.from?.name || 'Someone'} sent a gift</Text><View style={s.count}><Text style={s.countText}>×{gift.qty || gift.quantity || 1}</Text></View></View>
      <View style={s.stage}>
        {!reduceMotion && [[32, 48], [190, 70], [42, 143], [185, 150]].map(([left, top], i) => <Animated.View key={i} style={[s.glint, { left, top, opacity: progress.interpolate({ inputRange: [0, .15 + i * .03, .45 + i * .05, .8, 1], outputRange: [0, .8, .2, .6, 0] }), transform: [{ rotate: '45deg' }] }]} />)}
        <Animated.View style={{ transform: reduceMotion ? [] : [{ translateY: progress.interpolate({ inputRange: [0, .4, .75, 1], outputRange: [4, -3, 0, -4] }) }] }}><GiftArtwork id={gift.giftId} size={155} color={gift.customization?.color} /></Animated.View>
      </View>
      <Text style={s.title} numberOfLines={1}>{title}</Text><Text style={s.recipient} numberOfLines={1}>for {gift.to?.name || 'someone special'}</Text>
      {!!gift.customization?.message && <Text style={s.note} numberOfLines={2}>{gift.customization.message}</Text>}
    </View>
  </Animated.View>;
}
const s = StyleSheet.create({ wrap: { position: 'absolute', top: '23%', left: 0, right: 0, alignItems: 'center' }, card: { width: 256, maxWidth: '82%', borderRadius: 22, backgroundColor: '#211A2BEF', borderWidth: 1, borderColor: '#BA99644D', padding: 17, alignItems: 'center', shadowColor: '#07030C', shadowOpacity: .22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, top: { flexDirection: 'row', alignItems: 'center', gap: 9 }, sender: { color: '#CAB8CB', fontSize: 11, flex: 1 }, count: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#DEC09314' }, countText: { color: '#DCC093', fontSize: 12, fontWeight: '600' }, stage: { width: 220, height: 164, alignItems: 'center', justifyContent: 'center' }, glint: { width: 4, height: 4, backgroundColor: '#D6B889', borderRadius: 1 }, title: { color: '#F3E5D4', fontSize: 19, fontWeight: '600', letterSpacing: -.3 }, recipient: { color: '#A592AC', fontSize: 11, marginTop: 5 }, note: { color: '#D0BCCB', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 10 } });
