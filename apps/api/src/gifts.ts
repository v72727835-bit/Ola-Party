// Reference-inspired catalog. Prices are this app's test-coin prices, not quoted Ola prices.
export const giftCategories = ['Activity', 'Classic', 'Flying', 'Surprise Gift', 'Relationship', 'Ultra Star', 'Fame', 'Privilege', 'Filters', 'Parcel'];
export type Gift = { id: string; name: string; emoji: string; cost: number; category: string; minLevel: number; customizable: boolean; effect: string; badge: string };
const groups: [string, string, string][] = [
  ['Activity', '🌸 🎁 💐 🚲 🦋 💝 🌙 🎆 🎡 🏆 🎇 🧪 👑 🏅 ☁️ 🏰 ⛰️', 'Flower Envelope|Paper Plane Bouquet|Floral Gift Box|Flower Bicycle|Wing Bottle|Glass Heart Box|Moon Bell|Firework Cruise|Magic Wheel|The Holy Grail|Magic Gift Box|Magic Bottle|Star Crown|Gold Trophy|Cloud Divine|Golden Superior|Golden Pinnacle'],
  ['Classic', '🎶 ❤️ 😺 🐱 🐈 💣 🤗 🧧 🇮🇳 🚤 🌹 💘 💌 🔌 🌷 🏰 💍 🏰 💰 💋 🍩 🍦 🍊 🍭 🫖 🎟️ 🎠 🎉 🍰 🍭 👄 🎆 💡 💎 🏰 🎀 🎂 🏡 👢 📖 📷 🛋️ 🚘 🎹 🎤 🧊 🪄 🏎️', 'Neon Groove|Heart|Big Eye Cat|Cute Pet Girl|Magic Kitten|Landmine|Favorite Hug|Lucky Pocket|Colors of India|Motor Boat|Rose|Cupid Arrow|Letter Balloon|Love Charger|Garden|Love Castle|Marry Me|Fantasy Castle|Bounty Time|Kiss|Doughnut|Fruity Ice Cream|Orange Juice|Lolly Ice Pop|Tea Time|VIP Ticket|Carousel|Party Carnival|Dessert Cart|Lollipop|Red Lips|Firework|Chandelier|Romantic Mask|Necklace|Castle|Barrel|Happy Birthday|Small House|Golden Boot|Elf Magic Book|Bubble Camera|Sofa|Scepter|Sports Car|Romantic Fire|Wing of Defender|Stage|Magic Cube|Magic Carpet|Super Sports Car'],
  ['Flying', '❄️ 🎵 🕊️ 💋 🌹 😘 🦚 🦢 💘', 'Snowflake|Musical Beats|Flying|Kiss Kiss|Roses Bloom|Face Kiss|Peacock|Swan|Flying Cupid Arrow'],
  ['Surprise Gift', '💍 💎 🌸 💐 📦 🎁 ✨ 🟢 🔵 🟡 🟣 🧰 🧰 🧰 🧰 🗝️ 🗝️ 🔑 💎', 'Stellar Ring Box|Starlit Ring|Normal Golden Box|Deluxe Golden Box|Basic Magic Box|Advanced Magic Box|Enchantress|Magic Green Crystal|Magic Blue Crystal|Magic Golden Crystal|Magic Purple Crystal|Common Chest|Rare Chest|Epic Chest|Legendary Chest|Bronze Key|Silver Key|Gold Key|Crystal Key'],
  ['Relationship', '🏠 ⛵ 🌹 🦄 💞 🍭 🌹 💗 🏖️ 🍨 🌊 📔 😽 🌠 🔥 🎈 💍 🎂 🔮 🔒 💝 🍷 🎶 🧸 🦄 ⭐ 🍱 🌹 🚘 🐸 💒 🍬 🌷 🎈 👑 🪶 💖 🎠 💌 🔐 🎐 🎵 ⚔️ 💞 ☂️ 🎁 🧚 💌 💣 🎈 🔔 🫶 💑 🐦 🦢 🦋 🕊️ 💗 🌙 💐 🎶 📻 🏕️ 💟 🎼 🎵 🎁 🎂 🌷', 'Sweet Home|Ship of Friends|Romantic Rose|Dreamy Unicorn|Become a Couple|Sweet Lollipop|Passionate Rose|Love Cotton Candy|Heart of Beach|Pink Ice Cream|Ocean of Love|Pink Diary|Kiss With Me|Dream Planet|Love of Flames|Confession Balloon|Valentine Ring|Rose Cake|Crystal Ball|Pink Lock|Love Heart|Rose Wine|Life Music|I Love You|Unicorn|Go to the Stars|Heart Lunch Box|Crystal Rose|Pink Carriage|Frog Heart|Love Wedding|Rowing Ceremony|Romantic Bloom|Romantic Gift Planet|Heart Planet|Candy Jar|Pink Watering|Pink Balloon|Pink Crown|Dreamcatcher|Heart to Heart|Carousel Love|Go to the Future|Pink Love Lock|Wind Chime|Music|Pink Sword|Accompany|Love Umbrella|DIY Gift|Magical Fairy|Confession Letter|Color Bomb|Love Balloon|Wedding Bells|Heart Hands|Photograph|Pink Birds|Love Pigeon|Sweet Swan|Love Balance|Heart Wings|Heartbeat Test|Dynamic Heart|Love Bouquet|Wings of Heart|Rose Music Box|Camping Light|Love Song|Fables Playing|Sound of Love|Love Rhythm|Romantic Album|Pink Wedding|Romantic Opening|Floating Roses'],
  ['Ultra Star', '👑 🖼️ 🏅 💎 🌟 🎇', 'Custom Royal Frame|Star Frame|Golden Signature|Diamond Frame|Starlight Portrait|Ultra Celebration'],
  ['Fame', '👑 🖼️ 🏆 💎 🌟 🎁', 'Custom Fame Gift|Fame Portrait|Champion Frame|Fame Diamond|Fame Spotlight|Fame Celebration'],
  ['Privilege', '🏰 🐺 🦅 🦌 🦁 🐉 🌌 🚃 🐎 🏎️ 🛥️ ⚔️ 👑 🏖️ 🏜️ 🪔 🪄 👑 🐦 🔆 🎭 🐎 🌃', 'Cloudtop Castle|Lone Wolf|Desert Hawk|Woodland Champion|Gilded Lion|Skyfire Dragon|Golden Sky Palace|Fantasy Wagon|Luxury Carriage|Sleek Sports Car|Dream Yacht|Warrior Holy Shield|Crowning King|Beach House|Fata Morgana|Magic Lamp|King Scepter|Flower Crown|Phoenix|VIP Light Board|Gold Mask|VIP Mount|VIP Night'],
  ['Filters', '😘 🎂 💐 😈 😇 🐕 🎭 🧨 😸 😺 😻 😿', 'Airy Kiss|Birthday Filter|Flowers for You|Demon|Angel|Sleepy Shiba Inu|Morocco|Firecracker|Keyboard Cat|Big Mouth Cat|Rain Fan Cat|Crying Cat'],
  ['Parcel', '👍', 'Like'],
];
export const gifts: Gift[] = groups.flatMap(([category, art, labels]) => {
  const emojis = art.split(' ');
  return labels.split('|').map((name, i) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, emoji: emojis[i % emojis.length],
    cost: name === 'Rose' ? 10 : name === 'Heart' ? 50 : category === 'Parcel' ? 1 : [10, 20, 50, 100, 200, 500, 1000, 2000][i % 8] * (category === 'Privilege' ? 10 : 1),
    category, minLevel: category === 'Privilege' ? 41 : 1,
    customizable: category === 'Ultra Star' || category === 'Fame',
    effect: category === 'Flying' ? 'flying' : category === 'Filters' ? 'filter' : category === 'Relationship' ? 'hearts' : 'sparkle',
    badge: category === 'Privilege' ? 'VIP' : i < 3 ? 'NEW' : '',
  }));
});
// Keep existing transactions and clients compatible.
gifts.push({ id: 'crown', name: 'Crown', emoji: '👑', cost: 200, category: 'Activity', minLevel: 1, customizable: false, effect: 'sparkle', badge: '' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', cost: 500, category: 'Flying', minLevel: 1, customizable: false, effect: 'flying', badge: '' });
