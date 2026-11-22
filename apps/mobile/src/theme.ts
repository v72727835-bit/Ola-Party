import { Item, MIcon } from './types';

export const API = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
export const c = {
  ink: '#16112B', text: '#3A3550', muted: '#6F6A85', faint: '#9893AD', bg: '#F5F4F9', card: '#FFFFFF', line: '#ECEAF3',
  brand: '#FF2E74', violet: '#7C3AED', mango: '#FF9F1C', teal: '#00B89C', blue: '#3D7BFF', gold: '#FFC23C', red: '#E5484D', male: '#3D8BFF', female: '#FF4F9A',
};
export const brand: [string, string] = ['#FF2E74', '#8B3DFF'];
export const warm: [string, string] = ['#FFB21C', '#FF2E74'];
export const tagColors: Record<string, [string, string]> = { Chat: ['#00B89C', '#0EA5E9'], Music: ['#FF2E74', '#FF7A45'], Friends: ['#8B3DFF', '#C04BFF'], Gaming: ['#FF9F1C', '#F25C05'], Chill: ['#3D7BFF', '#6366F1'] };
export const decoLook: Record<string, MIcon> = { frame: 'circle-double', entrance: 'rocket-launch-outline', badge: 'star-circle' };
export const fallbackTints: [string, string][] = [['#FFB199', '#FF0844'], ['#A18CD1', '#7C3AED'], ['#84FAB0', '#0EA5E9'], ['#FCCB90', '#D57EEB'], ['#5EE7DF', '#3D7BFF'], ['#F6D365', '#FDA085']];

export const API_HOST = API.replace(/\/api$/, '');
export const frameColors = (equipped?: Item): [string, string] | null => equipped?.frame === 'frame-aurora' ? ['#5EF2C6', '#8B3DFF'] : equipped?.frame === 'frame-spark' ? ['#FFE08A', '#FF9F1C'] : null;
export const THEMES: Record<string, { name: string; colors: [string, string, string] }> = {
  teal: { name: 'Oasis', colors: ['#078B78', '#04AE99', '#12CDB0'] },
  galaxy: { name: 'Galaxy', colors: ['#2B0A55', '#1A0B3B', '#0E0726'] }, sunset: { name: 'Sunset', colors: ['#5A1236', '#3A0D2E', '#1B0716'] },
  ocean: { name: 'Ocean', colors: ['#06345A', '#0A2342', '#04121F'] }, forest: { name: 'Forest', colors: ['#0B4030', '#082C22', '#041611'] },
  royal: { name: 'Royal', colors: ['#4A2A06', '#2E1A08', '#140B03'] }, midnight: { name: 'Midnight', colors: ['#1B2236', '#11162A', '#070A14'] },
};
