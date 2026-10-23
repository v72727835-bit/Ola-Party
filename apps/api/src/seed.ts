// Sample community used when the server starts with an empty data file.
// Everything here is marked demo:true so it can be told apart from real users.
// Profile photos are placeholder portraits from randomuser.me (free for mockups).
type Row = Record<string, any>;
const photo = (g: 'men' | 'women', n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

const people: { name: string; g: 'men' | 'women'; n: number; bio: string; level: number; vip?: boolean }[] = [
  { name: 'Aarav Sharma', g: 'men', n: 32, bio: 'Guitar at 2am, chai at 6am. Delhi boy in Pune.', level: 27, vip: true },
  { name: 'Meera Iyer', g: 'women', n: 44, bio: 'Carnatic and lo-fi. Will judge your playlist, nicely.', level: 31, vip: true },
  { name: 'Zoya Khan', g: 'women', n: 65, bio: 'Shayari, old Bollywood and long talks.', level: 18 },
  { name: 'Rohan Verma', g: 'men', n: 75, bio: 'BGMI squad leader. Mic on, toxicity off.', level: 22 },
  { name: 'Priya Nair', g: 'women', n: 68, bio: 'Kochi to Bangalore. Coffee over everything.', level: 24, vip: true },
  { name: 'Kabir Singh', g: 'men', n: 46, bio: 'Punjabi beats only. Host of Bhangra Nights.', level: 35, vip: true },
  { name: 'Ananya Das', g: 'women', n: 12, bio: 'Reading Murakami, pretending to study for CAT.', level: 9 },
  { name: 'Vikram Rao', g: 'men', n: 52, bio: 'Cricket talk anytime. RCB forever.', level: 15 },
  { name: 'Sana Mirza', g: 'women', n: 79, bio: 'Night owl. Good listener. Bad at sleeping.', level: 20 },
  { name: 'Ishaan Gupta', g: 'men', n: 85, bio: 'Karaoke king of my hostel. Ask anyone.', level: 19 },
  { name: 'Riya Kapoor', g: 'women', n: 26, bio: 'Dance, dosa, drama. In that order.', level: 14 },
  { name: 'Arjun Mehta', g: 'men', n: 11, bio: 'Engineer by day, singer by night.', level: 12 },
  { name: 'Neha Joshi', g: 'women', n: 33, bio: 'Jaipur. Chai, books and sunsets.', level: 16 },
  { name: 'Aditya Kumar', g: 'men', n: 64, bio: 'Gym, gaana, gossip.', level: 8 },
  { name: 'Pooja Reddy', g: 'women', n: 90, bio: 'Hyderabad biryani supremacy. Fight me.', level: 21 },
  { name: 'Rahul Yadav', g: 'men', n: 22, bio: 'Lucknow ka ladka. Tehzeeb pehle.', level: 11 },
  { name: 'Kavya Menon', g: 'women', n: 57, bio: 'Classical singer learning western vocals.', level: 26, vip: true },
  { name: 'Manish Tiwari', g: 'men', n: 41, bio: 'Banaras se. Ghats, music and late night talks.', level: 13 },
  { name: 'Simran Kaur', g: 'women', n: 49, bio: 'Chandigarh. Bhangra queen in training.', level: 17 },
  { name: 'Dev Malhotra', g: 'men', n: 7, bio: 'New here. Say hi.', level: 4 },
];

const rooms: { title: string; description: string; category: string; owner: number; seated: number[]; members: number[]; notice: string }[] = [
  { title: 'Bollywood Antakshari', description: 'Last letter se gaana shuru karo. Losers sing twice.', category: 'Music', owner: 9, seated: [9, 1, 0, 5, 16, 10], members: [9, 1, 0, 5, 16, 10, 3, 12, 18], notice: 'Take a seat to sing. Request songs in chat.' },
  { title: 'Chill and Chai', description: 'Adda for anyone who wants to talk about their day.', category: 'Chat', owner: 4, seated: [4, 2, 6, 12], members: [4, 2, 6, 12, 8, 15], notice: 'No pressure, just vibes. Be kind.' },
  { title: 'Late Night Dil Ki Baatein', description: 'For the 1am thoughts. Be kind, be real.', category: 'Friends', owner: 8, seated: [8, 2, 17], members: [8, 2, 17, 6, 13], notice: 'Raise hand to share your story.' },
  { title: 'Bhangra Nights', description: 'Punjabi hits all night. Request your song in chat.', category: 'Music', owner: 5, seated: [5, 18, 0, 4, 9, 13, 10], members: [5, 18, 0, 4, 9, 13, 10, 1, 7, 14, 11], notice: 'Kabir on the decks till 2am.' },
  { title: 'BGMI Squad Up', description: 'Need 2 for ranked. Mic compulsory.', category: 'Gaming', owner: 3, seated: [3, 7, 13], members: [3, 7, 13, 0, 19], notice: 'Erangel ranked at 10pm. Team code in chat.' },
  { title: 'Cricket Katta', description: 'Match discussion, fantasy tips and lots of shouting.', category: 'Chat', owner: 7, seated: [7, 3, 15], members: [7, 3, 15, 9, 11], notice: 'Keep it friendly. No abuse for any team.' },
  { title: 'Lo-fi Study Room', description: 'Silent company while you study. Pomodoro every 25 minutes.', category: 'Chill', owner: 6, seated: [6, 1, 12], members: [6, 1, 12, 8], notice: 'Mics stay muted during focus time.' },
  { title: 'New Here? Say Hi', description: 'First time on Party App? Come in, we will show you around.', category: 'Friends', owner: 1, seated: [1, 8, 2, 19], members: [1, 8, 2, 19, 4, 14], notice: 'Tap an empty seat to join the mic.' },
  { title: 'Shayari Mehfil', description: 'Apni ya pasandida shayari sunao. Urdu, Hindi, Punjabi sab chalega.', category: 'Chat', owner: 2, seated: [2, 17, 12], members: [2, 17, 12, 15, 6], notice: 'One poet at a time. Wah wah in chat.' },
  { title: 'Carnatic to Coke Studio', description: 'Classical, fusion and indie. Live singing welcome.', category: 'Music', owner: 16, seated: [16, 1, 11], members: [16, 1, 11, 4, 9], notice: 'Riyaz session every Sunday at 7pm.' },
  { title: 'Ludo Masti', description: 'Ludo, tic-tac-toe and Connect Four. Losers dance.', category: 'Gaming', owner: 14, seated: [14, 10, 13, 19], members: [14, 10, 13, 19, 3], notice: 'Open Games from the menu to play.' },
  { title: 'Banaras Ki Shaam', description: 'Ghats, ganga aarti stories and old songs.', category: 'Chill', owner: 17, seated: [17, 15], members: [17, 15, 12], notice: 'Slow songs only after 11pm.' },
];

const roomChat: [number, number, string][] = [
  [0, 9, 'Chalo shuru karte hain. Tujhe dekha to ye jaana sanam'], [0, 1, 'M se... Mere sapno ki rani'], [0, 0, 'Arre wah, full form mein ho aaj'], [0, 5, 'Next round mera turn, ready raho'], [0, 16, 'Kavya on seat 5, request lo'], [0, 3, 'Ye room hamesha best hota hai'],
  [1, 4, 'Good evening everyone. Kaisa raha din?'], [1, 2, 'Thak gayi yaar, but chai in hand so all good'], [1, 6, 'Exam kal hai aur main yahan hoon'], [1, 12, 'Same energy honestly'],
  [2, 8, 'Kabhi kabhi bas kisi se baat karni hoti hai na'], [2, 2, 'Haan, isliye toh yahan aate hain'], [2, 17, 'Aaj ka topic: pehla crush'],
  [3, 5, 'Volume up karo sab'], [3, 0, 'Diljit wala daalo next'], [3, 4, 'Kabir paaji fire hai aaj'], [3, 18, 'Lamberghini please'], [3, 13, 'Seat khaali ho to bulao'],
  [4, 3, 'Ranked mein 2 aur chahiye, Erangel'], [4, 7, 'Main ready hoon, 5 min'],
  [5, 7, 'Aaj ki pitch pe 180 easy hai'], [5, 3, 'Bhai 150 bhi mushkil lag raha hai'],
  [6, 6, 'Next pomodoro 9:30 pe. Phone side mein rakho'],
  [7, 1, 'Welcome welcome. Koi bhi sawal ho toh pucho'], [7, 8, 'Seat pe tap karke mic le sakte ho'],
  [8, 2, 'Kuch log baatein nahi, ehsaas chhod jaate hain'], [8, 17, 'Wah wah, irshaad'],
  [9, 16, 'Aaj Yaman raag try karte hain'], [10, 14, 'Ludo khelne kaun aa raha hai?'], [11, 17, 'Aaj ghat pe bahut bheed thi'],
];

const posts: [number, string, number[]][] = [
  [6, 'Library band ho gayi, ab Lo-fi Study Room hi sahara hai. Join karo 9 baje.', [1, 8, 12]],
  [7, 'Aaj ka match dekh ke BP high ho gaya. Kal Cricket Katta mein milte hain.', [3, 9, 0, 15]],
  [2, 'Kuch log baatein nahi, ehsaas chhod jaate hain. Good night everyone.', [8, 1, 4, 6, 17]],
  [3, 'Chicken dinner with randoms from Party App. Thanks Vikram and Aarav.', [7, 0, 13]],
  [4, 'Bangalore rain, filter coffee and a good playlist. Perfect Sunday.', [1, 2, 5, 9, 12]],
  [16, 'Finally sang Lag Ja Gale live in Carnatic to Coke Studio. Hands were shaking.', [1, 11, 9, 4, 2, 0]],
  [9, 'Kal raat antakshari mein 4 rounds jeete. Challenge accept karne wale aao.', [1, 5, 0, 10]],
  [1, 'Hosting New Here? Say Hi every evening at 8. Naye log, aa jao.', [8, 2, 4, 6, 9, 19]],
  [5, 'Bhangra Nights crossed 50 listeners last night. You guys are crazy, thank you.', [0, 4, 9, 1, 7, 3, 18, 13]],
  [14, 'Hyderabad walo, biryani ke liye best jagah batao. Paradise mat bolna.', [10, 15, 3]],
  [0, 'Late night jam session ka plan hai. Guitar ready, koi singer chahiye.', [1, 5, 11]],
  [8, 'Neend nahi aa rahi. Kaun jaag raha hai?', [2, 6, 17]],
];

const comments: [number, number, string][] = [
  [0, 1, 'Main aaungi'], [1, 3, 'RCB fans ka dard samajh sakta hoon'], [2, 8, 'Uff, ye line'], [4, 5, 'Bangalore weather is cheating'], [5, 1, 'Goosebumps aa gaye the'], [5, 9, 'Next week phir gaana'],
  [6, 1, 'Challenge accepted'], [7, 4, 'Best host ever'], [8, 0, 'Legendary night tha bhai'], [8, 9, 'Next week phir'], [9, 15, 'Shah Ghouse try karo'], [10, 11, 'Main ga sakta hoon, ping karo'], [11, 2, 'Jaag rahi hoon, Late Night room mein aa jao'],
];

const families = [
  { name: 'Desi Vibes Squad', description: 'Music, masti and late night adda. Everyone is family here.', owner: 5, members: [5, 0, 4, 9, 1, 18, 13] },
  { name: 'Night Owls', description: 'For people who come alive after midnight. Good talks only.', owner: 8, members: [8, 2, 6, 17] },
  { name: 'Gamers Adda', description: 'BGMI, Valorant, Ludo. Daily squads at 9pm.', owner: 3, members: [3, 7, 0, 14, 19] },
  { name: 'Sur Sangam', description: 'Singers, listeners and antakshari champions.', owner: 9, members: [9, 1, 5, 16, 11] },
];

const events = [
  { title: 'Antakshari Mahamuqabla', description: 'Teams of 4. Top team gets the Crown badge for a week.', inDays: 2, hour: 21, host: 9 },
  { title: 'Bhangra Nights Live', description: 'Kabir on the decks. Dress up your profile, bring your energy.', inDays: 1, hour: 22, host: 5 },
  { title: 'Open Mic: Shayari and Poetry', description: 'Read your own lines or your favourite ones. All languages welcome.', inDays: 4, hour: 20, host: 2 },
  { title: 'Sunday Cricket Watch Party', description: 'Watch together, cry together. Live commentary by Vikram.', inDays: 6, hour: 15, host: 7 },
];

const giftLedger: [number, number, string, number][] = [
  [0, 5, 'crown', 200], [4, 5, 'rocket', 500], [9, 1, 'heart', 50], [5, 1, 'crown', 200], [3, 4, 'heart', 50], [7, 8, 'rose', 10], [1, 8, 'heart', 50], [0, 2, 'rose', 10], [6, 9, 'heart', 50], [2, 0, 'crown', 200], [9, 4, 'rose', 10], [5, 9, 'heart', 50],
  [18, 5, 'rocket', 500], [13, 16, 'crown', 200], [11, 16, 'heart', 50], [10, 14, 'rose', 10], [15, 2, 'heart', 50], [12, 17, 'crown', 200],
];

// Direct messages a new demo guest receives so their inbox is not empty.
export const welcomeMessages: [number, string][] = [
  [1, 'Hey, welcome to Party App! "New Here? Say Hi" room mein aa jao, sab friendly hain.'],
  [5, 'Aaj raat 10 baje Bhangra Nights hai, zaroor aana.'],
  [8, 'Hi! Agar kabhi raat ko neend na aaye, Late Night room mein milte hain.'],
];

const towns = ['Pune', 'Chennai', 'Lucknow', 'Delhi', 'Bangalore', 'Ludhiana', 'Kolkata', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Mumbai', 'Ahmedabad', 'Jaipur', 'Indore', 'Hyderabad', 'Lucknow', 'Kochi', 'Varanasi', 'Chandigarh', 'Noida'];
const tagSets = [['Music', 'Guitar', 'Night owl'], ['Singing', 'Lo-fi', 'Books'], ['Shayari', 'Movies'], ['Gaming', 'BGMI'], ['Coffee', 'Travel'], ['Bhangra', 'DJ', 'Gym'], ['Books', 'Study'], ['Cricket', 'Fantasy'], ['Talks', 'Late nights'], ['Karaoke', 'Food']];
export function seedState(hashPassword: (p: string) => string, secret: () => string): Row {
  const t = Date.now();
  const ago = (min: number) => new Date(t - min * 60000).toISOString();
  const users = people.map((p, i) => ({
    id: `demo-${i + 1}`, name: p.name, email: `demo${i + 1}@example.invalid`, password: hashPassword(secret()),
    avatar: '', photo: photo(p.g, p.n), gender: p.g === 'men' ? 'male' : 'female', level: p.level, bio: p.bio, country: 'IN', hometown: towns[i % towns.length], birthday: `${1996 + (i % 9)}-${String(1 + (i * 5) % 12).padStart(2, '0')}-${String(3 + (i * 7) % 25).padStart(2, '0')}`, tags: tagSets[i % tagSets.length],
    followers: [] as string[], following: [] as string[], blocked: [], coins: 400 + p.level * 90, diamonds: p.level * 40, vip: !!p.vip, role: 'user', demo: true,
  }));
  const id = (i: number) => users[i].id;
  users.forEach((u, i) => { for (let k = 1; k <= 4; k++) { const other = users[(i + k * 3) % users.length]; if (other.id !== u.id && !u.following.includes(other.id)) { u.following.push(other.id); other.followers.push(u.id); } } });
  const pub = (i: number) => ({ id: id(i), name: users[i].name, avatar: '', photo: users[i].photo, level: users[i].level });
  const seededRooms = rooms.map((r, i) => ({
    id: `room-${i + 1}`, code: String(80080000 + i * 137 + 11), title: r.title, description: r.description, notice: r.notice, category: r.category,
    cover: users[r.owner].photo, theme: ['galaxy', 'sunset', 'ocean', 'forest', 'royal', 'midnight'][i % 6], admins: [id(r.members[1])], ownerId: id(r.owner), members: r.members.map(id),
    seats: Array.from({ length: 12 }, (_, index) => ({ index, userId: r.seated[index] !== undefined ? id(r.seated[index]) : null, muted: false, locked: false })),
    locked: false, password: null, demo: true,
  }));
  const messages = roomChat.map(([room, from, text], i) => ({ id: `seed-msg-${i + 1}`, roomId: `room-${room + 1}`, fromId: id(from), author: pub(from), text, createdAt: ago(120 - i * 3) }));
  const seededPosts = posts.map(([author, text, likes], i) => ({ id: `post-${i + 1}`, authorId: id(author), text, image: null, likes: likes.map(id), createdAt: ago((posts.length - i) * 85), demo: true }));
  const seededComments = comments.map(([post, author, text], i) => ({ id: `seed-comment-${i + 1}`, postId: `post-${post + 1}`, authorId: id(author), text, createdAt: ago((posts.length - post) * 85 - 20) }));
  const ledger = giftLedger.map(([from, to, giftId, amount], i) => ({ id: `seed-gift-${i + 1}`, giftId, recipientId: id(to), quantity: 1, fromId: id(from), type: 'gift', amount, createdAt: ago(60 * (i + 2)) }));
  const seededFamilies = families.map((f, i) => ({ id: `family-${i + 1}`, name: f.name, description: f.description, ownerId: id(f.owner), members: f.members.map(id), cover: users[f.owner].photo, demo: true }));
  const seededEvents = events.map((e, i) => { const d = new Date(t + e.inDays * 86400000); d.setHours(e.hour, 0, 0, 0); return { id: `event-${i + 1}`, title: e.title, description: e.description, hostId: id(e.host), cover: users[e.host].photo, startsAt: d.toISOString(), attendees: [id(e.host), id((e.host + 1) % users.length), id((e.host + 4) % users.length), id((e.host + 7) % users.length)], demo: true }; });
  return { users, sessions: [], rooms: seededRooms, messages, ledger, posts: seededPosts, comments: seededComments, families: seededFamilies, events: seededEvents, reports: [], claims: [] };
}
