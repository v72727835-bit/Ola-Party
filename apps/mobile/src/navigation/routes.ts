import { Item } from '../types';

/** Bottom tab bar entries; '+' opens the start-a-room page. */
export const NAV_TABS = [{ name: 'Party', icon: 'home-outline', active: 'home' }, { name: 'Explore', icon: 'compass-outline', active: 'compass' }, { name: '+', icon: 'add', active: 'add' }, { name: 'Messages', icon: 'chatbubble-ellipses-outline', active: 'chatbubble-ellipses' }, { name: 'Me', icon: 'person-outline', active: 'person' }] as const;

/** Pages that belong to the current room: Back returns to the room instead of home. */
export const ROOM_PAGES = ['games', 'game', 'pk', 'gifts', 'user', 'room-settings', 'queue', 'lucky'];

/** App bar title for each detail page. */
export const pageTitles = (dm: Item | null, game: Item | null): Record<string, string> => ({ notifications: 'Notifications', visitors: 'Visitors', strangers: 'Stranger messages', 'join-locked': 'Private room', 'room-settings': 'Room settings', 'create-room': 'Start a room', dm: dm?.name || 'Chat', games: 'Games', game: game?.type === 'uno' ? 'UNO' : game?.type === 'ludo' ? 'Ludo' : game?.type === 'connect-four' ? 'Connect Four' : 'Tic-tac-toe', pk: 'PK battle', wallet: 'Wallet', gifts: 'Send a gift', families: 'Families', events: 'Events', tasks: 'Daily rewards', leaderboard: 'Rankings', vip: 'VIP', store: 'Store', 'edit-profile': 'Edit profile', settings: 'Settings', decorations: 'Style shop', lucky: 'Lucky bag', queue: 'Mic queue', user: 'Profile', comments: 'Comments' });

type BackArgs = { page: string; giftFromDm: boolean; dm: Item | null; room: Item | null; navigate: (p: string) => void; setGiftFromDm: (v: boolean) => void; goHome: () => void };
/** What the Back button (and Android hardware back) does on the current page. */
export function getBack({ page, giftFromDm, dm, room, navigate, setGiftFromDm, goHome }: BackArgs) {
  return page === 'gifts' && giftFromDm && dm ? () => { setGiftFromDm(false); navigate('dm'); } : page === 'room' ? () => navigate('') : room && ROOM_PAGES.includes(page) ? () => navigate('room') : goHome;
}
