// Sample community used when the server starts with an empty data file.
// Everything here is marked demo:true so it can be told apart from real users.
type Row = Record<string, any>;

const people = [
  { name: 'Aarav Sharma', avatar: '🎸', bio: 'Guitar at 2am, chai at 6am. Delhi boy in Pune.', coins: 2400, diamonds: 860, vip: true },
  { name: 'Meera Iyer', avatar: '🌸', bio: 'Carnatic + lo-fi. Will judge your playlist (nicely).', coins: 1800, diamonds: 1240, vip: true },
  { name: 'Zoya Khan', avatar: '🦋', bio: 'Shayari, old Bollywood and long talks.', coins: 950, diamonds: 640, vip: false },
  { name: 'Rohan Verma', avatar: '🎮', bio: 'BGMI squad leader. Free fire? Never heard of it.', coins: 3100, diamonds: 410, vip: false },
  { name: 'Priya Nair', avatar: '☕', bio: 'Kochi → Bangalore. Coffee > everything.', coins: 720, diamonds: 980, vip: true },
  { name: 'Kabir Singh', avatar: '🎧', bio: 'Punjabi beats only. Host of Bhangra Nights.', coins: 4200, diamonds: 1520, vip: true },
  { name: 'Ananya Das', avatar: '📚', bio: 'Reading Murakami, pretending to study for CAT.', coins: 410, diamonds: 230, vip: false },
  { name: 'Vikram Rao', avatar: '🏏', bio: 'Cricket talk anytime. RCB forever (pain).', coins: 1300, diamonds: 520, vip: false },
  { name: 'Sana Mirza', avatar: '🌙', bio: 'Night owl. Good listener. Bad at sleeping.', coins: 860, diamonds: 1090, vip: false },
  { name: 'Ishaan Gupta', avatar: '🎤', bio: 'Karaoke king of my hostel. Ask anyone.', coins: 1650, diamonds: 770, vip: false },
];

const rooms = [
  { title: 'Chill & Chai ☕', description: 'Adda for anyone who wants to talk about their day. No pressure, just vibes.', category: 'Chat', owner: 4, seated: [4, 2, 6], members: [4, 2, 6, 8] },
  { title: 'Bollywood Antakshari 🎶', description: 'Last letter se gaana shuru karo. Losers sing twice!', category: 'Music', owner: 9, seated: [9, 1, 0, 5], members: [9, 1, 0, 5, 3] },
  { title: 'Late Night Dil Ki Baatein', description: 'For the 1am thoughts. Be kind, be real.', category: 'Friends', owner: 8, seated: [8, 2], members: [8, 2, 6] },
  { title: 'BGMI Squad Up 🎮', description: 'Need 2 for ranked. Mic compulsory, toxicity not allowed.', category: 'Gaming', owner: 3, seated: [3, 7], members: [3, 7, 0] },
  { title: 'Bhangra Nights 🔥', description: 'Punjabi hits all night. Request your song in chat.', category: 'Music', owner: 5, seated: [5, 0, 4, 9], members: [5, 0, 4, 9, 1, 7] },
  { title: 'Cricket Katta 🏏', description: 'Match discussion, fantasy tips and lots of shouting.', category: 'Chat', owner: 7, seated: [7, 3], members: [7, 3, 9] },
  { title: 'Lo-fi Study Room 📚', description: 'Silent company while you study. Pomodoro every 25 min.', category: 'Chill', owner: 6, seated: [6, 1], members: [6, 1, 8] },
  { title: 'New Here? Say Hi 👋', description: 'First time on Party App? Come in, we will show you around.', category: 'Friends', owner: 1, seated: [1, 8, 2], members: [1, 8, 2, 4] },
];

const roomChat: [number, number, string][] = [
  [0, 4, 'Good evening everyone! Kaisa raha din?'], [0, 2, 'Thak gayi yaar, but chai in hand so all good ☕'], [0, 6, 'Exam kal hai aur main yahan hoon 😅'], [0, 8, 'Same energy honestly'],
  [1, 9, 'Chalo shuru karte hain — "Tujhe dekha to ye jaana sanam" 🎤'], [1, 1, 'M se... Mere sapno ki rani!'], [1, 0, 'Arre wah, full form mein ho aaj'], [1, 5, 'Next round mera turn, ready raho'],
  [2, 8, 'Kabhi kabhi bas kisi se baat karni hoti hai na'], [2, 2, 'Haan, isliye toh yahan aate hain ♡'],
  [3, 3, 'Ranked mein 2 aur chahiye, Erangel'], [3, 7, 'Main ready hoon, 5 min'],
  [4, 5, 'Volume up karo sab! 🔥'], [4, 0, 'Diljit wala daalo next'], [4, 4, 'Ye room hamesha best hota hai'],
  [5, 7, 'Aaj ki pitch pe 180 easy hai'], [5, 3, 'Bhai 150 bhi mushkil lag raha hai'],
  [6, 6, 'Next pomodoro 9:30 pe. Phone side mein rakho 📵'],
  [7, 1, 'Welcome welcome! Koi bhi sawal ho toh pucho 😊'], [7, 8, 'Seat pe tap karke mic le sakte ho'],
];

const posts: [number, string, number[]][] = [
  [6, 'Library band ho gayi, ab Lo-fi Study Room hi sahara hai 📚 join karo 9 baje', [1, 8]],
  [7, 'Aaj ka match dekh ke BP high ho gaya. Kal Cricket Katta mein milte hain 🏏', [3, 9, 0]],
  [2, 'Kuch log baatein nahi, ehsaas chhod jaate hain. Good night everyone 🌙', [8, 1, 4, 6]],
  [3, 'Chicken dinner with randoms from Party App! Thanks Vikram & Aarav 🍗', [7, 0]],
  [4, 'Bangalore rain + filter coffee + good playlist = perfect Sunday ☕🌧️', [1, 2, 5, 9]],
  [9, 'Kal raat antakshari mein 4 rounds jeete. Challenge accept karne wale aao 🎤', [1, 5, 0]],
  [1, 'Hosting "New Here? Say Hi" every evening at 8. Naye log, aa jao ♡', [8, 2, 4, 6, 9]],
  [5, 'Bhangra Nights crossed 50 listeners last night!! You guys are crazy 🔥🙏', [0, 4, 9, 1, 7, 3]],
  [0, 'Late night jam session ka plan hai. Guitar + koi singer chahiye 🎸', [1, 5]],
  [8, 'Neend nahi aa rahi. Kaun jaag raha hai? 🌙', [2, 6]],
];

const comments: [number, number, string][] = [
  [0, 1, 'Main aaungi!'], [1, 3, 'RCB fans ka dard samajh sakta hoon 😂'], [2, 8, 'Uff, ye line ❤️'], [4, 5, 'Bangalore weather is cheating'],
  [5, 1, 'Challenge accepted 😤'], [6, 4, 'Best host ever'], [7, 0, 'Legendary night tha bhai'], [7, 9, 'Next week phir!'], [8, 9, 'Main ga sakta hoon, ping karo'], [9, 2, 'Jaag rahi hoon, Late Night room mein aa jao'],
];

const families = [
  { name: 'Desi Vibes Squad', description: 'Music, masti and late night adda. Everyone is family here.', owner: 5, members: [5, 0, 4, 9, 1] },
  { name: 'Night Owls 🌙', description: 'For people who come alive after midnight. Good talks only.', owner: 8, members: [8, 2, 6] },
  { name: 'Gamers Adda', description: 'BGMI, Valorant, Ludo — sab chalega. Daily squads at 9pm.', owner: 3, members: [3, 7, 0] },
  { name: 'Sur Sangam', description: 'Singers, listeners and antakshari champions.', owner: 9, members: [9, 1, 5] },
];

const events = [
  { title: 'Antakshari Mahamuqabla', description: 'Teams of 4. Top team gets the Crown badge for a week.', inDays: 2, hour: 21, host: 9 },
  { title: 'Bhangra Nights Live', description: 'Kabir on the decks. Dress up your profile, bring your energy.', inDays: 1, hour: 22, host: 5 },
  { title: 'Open Mic: Shayari & Poetry', description: 'Read your own lines or your favourite ones. All languages welcome.', inDays: 4, hour: 20, host: 2 },
  { title: 'Sunday Cricket Watch Party', description: 'Watch together, cry together. Live commentary by Vikram.', inDays: 6, hour: 15, host: 7 },
];

const giftLedger: [number, number, string, number][] = [
  [0, 5, 'crown', 200], [4, 5, 'rocket', 500], [9, 1, 'heart', 50], [5, 1, 'crown', 200], [3, 4, 'heart', 50], [7, 8, 'rose', 10], [1, 8, 'heart', 50], [0, 2, 'rose', 10], [6, 9, 'heart', 50], [2, 0, 'crown', 200], [9, 4, 'rose', 10], [5, 9, 'heart', 50],
];

// Direct messages a new demo guest receives so their inbox is not empty.
export const welcomeMessages: [number, string][] = [
  [1, 'Hey, welcome to Party App! 😊 "New Here? Say Hi" room mein aa jao, sab friendly hain.'],
  [5, 'Aaj raat 10 baje Bhangra Nights hai, zaroor aana 🔥'],
  [8, 'Hi! Agar kabhi raat ko neend na aaye, Late Night room mein milte hain 🌙'],
];

export function seedState(hashPassword: (p: string) => string, secret: () => string): Row {
  const t = Date.now();
  const ago = (min: number) => new Date(t - min * 60000).toISOString();
  const users = people.map((p, i) => ({
    id: `demo-${i + 1}`, name: p.name, email: `demo${i + 1}@example.invalid`, password: hashPassword(secret()),
    avatar: p.avatar, bio: p.bio, country: 'IN', followers: [] as string[], following: [] as string[], blocked: [],
    coins: p.coins, diamonds: p.diamonds, vip: p.vip, role: 'user', demo: true,
  }));
  const id = (i: number) => users[i].id;
  users.forEach((u, i) => { for (let k = 1; k <= 3; k++) { const other = users[(i + k * 3) % users.length]; if (other.id !== u.id && !u.following.includes(other.id)) { u.following.push(other.id); other.followers.push(u.id); } } });
  const seededRooms = rooms.map((r, i) => ({
    id: `room-${i + 1}`, title: r.title, description: r.description, category: r.category,
    cover: ['#FF5E8A', '#7B5CFF', '#FF9F1C', '#00B894', '#E84393', '#0984E3', '#6C5CE7', '#FD7E14'][i],
    ownerId: id(r.owner), members: r.members.map(id),
    seats: Array.from({ length: 8 }, (_, index) => ({ index, userId: r.seated[index] !== undefined ? id(r.seated[index]) : null, muted: false, locked: false })),
    locked: false, password: null, demo: true,
  }));
  const messages = roomChat.map(([room, from, text], i) => ({ id: `seed-msg-${i + 1}`, roomId: `room-${room + 1}`, fromId: id(from), author: { id: id(from), name: users[from].name, avatar: users[from].avatar }, text, createdAt: ago(90 - i * 4) }));
  const seededPosts = posts.map(([author, text, likes], i) => ({ id: `post-${i + 1}`, authorId: id(author), text, image: null, likes: likes.map(id), createdAt: ago((posts.length - i) * 95), demo: true }));
  const seededComments = comments.map(([post, author, text], i) => ({ id: `seed-comment-${i + 1}`, postId: `post-${post + 1}`, authorId: id(author), text, createdAt: ago((posts.length - post) * 95 - 20) }));
  const ledger = giftLedger.map(([from, to, giftId, amount], i) => ({ id: `seed-gift-${i + 1}`, giftId, recipientId: id(to), quantity: 1, fromId: id(from), type: 'gift', amount, createdAt: ago(60 * (i + 2)) }));
  const seededFamilies = families.map((f, i) => ({ id: `family-${i + 1}`, name: f.name, description: f.description, ownerId: id(f.owner), members: f.members.map(id), demo: true }));
  const seededEvents = events.map((e, i) => { const d = new Date(t + e.inDays * 86400000); d.setHours(e.hour, 0, 0, 0); return { id: `event-${i + 1}`, title: e.title, description: e.description, hostId: id(e.host), startsAt: d.toISOString(), attendees: [id(e.host), id((e.host + 1) % users.length), id((e.host + 4) % users.length)], demo: true }; });
  return { users, sessions: [], rooms: seededRooms, messages, ledger, posts: seededPosts, comments: seededComments, families: seededFamilies, events: seededEvents, reports: [], claims: [] };
}
