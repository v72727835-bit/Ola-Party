/** Original gift illustration system. Rebuild with Node 24+ and sharp installed.
 * GIFT_SHARP_MODULE may point to an existing sharp installation. No network calls.
 */
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gifts } from '../apps/api/src/gifts.ts';
const require = createRequire(import.meta.url);
const sharp = require(process.env.GIFT_SHARP_MODULE || 'sharp');
const destination = new URL('../apps/mobile/assets/gifts/', import.meta.url);
await mkdir(destination, { recursive: true });
async function writeChanged(file, contents) {
  const next = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  try { if ((await readFile(file)).equals(next)) return; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeFile(file, next);
}
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const rect = (x,y,w,h,r,fill,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const line = (x1,y1,x2,y2,stroke,width=3) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
const group = (body, transform = '') => `<g transform="${transform}">${body}</g>`;
const gold = 'url(#gold)', edge = '#A76B27', pink = 'url(#petal)', body = 'url(#body)', glass = 'url(#glass)', ivory = 'url(#ivory)';
const star = (x,y,r=7,fill=gold) => path(`M${x} ${y-r}Q${x+1} ${y-1} ${x+r} ${y}Q${x+1} ${y+1} ${x} ${y+r}Q${x-1} ${y+1} ${x-r} ${y}Q${x-1} ${y-1} ${x} ${y-r}`,fill);
const gem = (x,y,r=11) => group(path(`M0 ${-r}L${r} ${-r*.25}L${r*.6} ${r*.8}L${-r*.6} ${r*.8}L${-r} ${-r*.25}Z`,body)+path(`M0 ${-r}L${r*.3} 0L0 ${r*.8}L${-r*.4} 0Z`,'#FFFFFF85')+line(-r*.7,-r*.2,r*.7,-r*.2,'#FFFFFF88',1),`translate(${x} ${y})`);
function heart(x=120,y=110,scale=1) { return group(path('M0 48C-20 30-62 7-61-25C-60-58-20-65 0-35C22-65 61-56 61-25C61 5 21 31 0 48Z','#AE315A')+path('M0 42C-21 24-56 3-55-26C-54-54-20-58 0-30C20-58 54-52 55-25C56 2 20 26 0 42Z',pink)+path('M-42-28C-41-44-25-47-16-39','none','stroke="#FFF1EF" stroke-width="7" stroke-linecap="round" opacity=".8"')+path('M0-30L-14-2L0 42L17-2Z','#FFFFFF10'),`translate(${x} ${y}) scale(${scale})`); }
function bloom(x,y,r=20) { return group(Array.from({length:7},(_,i)=>`<ellipse cx="0" cy="${-r*.4}" rx="${r*.55}" ry="${r*.72}" fill="${i%2?pink:'url(#soft)'}" stroke="#FDDACB66" stroke-width=".7" transform="rotate(${i*51.4})"/>`).join('')+circle(0,0,r*.44,pink)+path(`M${-r*.25} 0Q0 ${-r*.4} ${r*.22} 0Q0 ${r*.3} ${-r*.25} 0`,'none','stroke="#FFE3C8" stroke-width="2"'),`translate(${x} ${y})`); }
function foliage() { return path('M100 195Q103 151 137 101','none','stroke="#317F63" stroke-width="5"')+path('M112 159Q70 166 80 137Q105 135 112 159Z','url(#leaf)')+path('M121 135Q158 139 158 115Q129 111 121 135Z','url(#leaf)'); }
function rose() { return foliage()+path('M111 166L122 178L106 185L104 172Z',gold)+bloom(134,85,40)+path('M124 71Q141 60 150 80','none','stroke="#FFF2E7" stroke-width="3" opacity=".7"'); }
function bouquet() { return path('M72 111L119 210L168 111Z',ivory)+path('M83 115L119 210L137 129Z','#E9C9BA')+path('M100 134L119 210L143 135Z',body)+path('M80 113L119 137L165 110L150 157L119 164L94 146Z','#FFF3E7')+group(foliage(),'translate(14 -33) scale(.8)')+bloom(86,96,22)+bloom(145,95,25)+bloom(114,71,27)+bloom(113,113,24)+path('M106 166Q74 151 85 177Q93 186 109 174Q145 152 147 174Q138 191 117 176L130 202L116 197L107 207Z',gold); }
function envelope() { return group(bouquet(),'translate(47 0) scale(.65)')+path('M48 124L120 82L193 124L186 201L56 201Z',gold)+path('M48 124L120 170L193 124L186 201L56 201Z',body)+path('M56 201L120 154L186 201Z','url(#soft)')+path('M49 124L120 169L193 124','none','stroke="#FFE8CF" stroke-width="3"')+heart(122,166,.26); }
function box(chest=false) { return (chest?path('M56 102Q57 58 120 57Q183 58 184 102Z',gold):'')+rect(58,102,124,93,11,body)+path('M58 118L182 118L182 195L159 202L159 122Z','#1A16312D')+rect(49,91,142,31,8,'url(#soft)')+rect(106,92,24,105,2,gold)+rect(56,176,128,7,2,'#FFFFFF17')+path('M118 91C82 95 58 75 76 61C90 45 110 61 118 91Z',gold)+path('M118 91C137 47 171 49 170 69C168 85 142 92 118 91Z',gold)+path('M118 91C98 80 83 69 80 66M121 88Q143 65 161 65','none','stroke="#FFF2C5" stroke-width="3" opacity=".8"')+gem(120,141,15); }
function crown() { return path('M52 83L71 177Q119 193 167 177L188 83L151 116L120 65L89 116Z',gold)+path('M67 145Q120 165 174 145L167 177Q119 191 72 177Z',edge)+path('M69 147Q120 164 171 147L167 166Q120 184 72 167Z',gold)+gem(120,137,15)+gem(85,143,9)+gem(155,143,9)+[52,120,188].map((x,i)=>circle(x,i===1?65:83,7,gold)).join('')+path('M72 130L63 96L89 124L118 79','none','stroke="#FFF3CA" stroke-width="3"'); }
function bottle(wing=false) { return (wing?group(wings(),'translate(0 15)'):'')+rect(101,45,38,25,6,gold)+path('M105 68L105 89Q72 102 71 135L76 183Q120 211 164 183L169 135Q168 101 135 89L135 68Z',glass,'stroke="#DBF8FFB0" stroke-width="2"')+path('M78 148Q119 133 162 146L160 177Q120 201 80 179Z',body)+path('M94 108Q81 117 86 166','none','stroke="#FFFFFFB0" stroke-width="5" stroke-linecap="round"')+gem(121,153,23)+rect(103,54,34,6,2,'#FFF0B2')+star(153,102,7); }
function wings() { return path('M106 148Q45 158 28 87Q48 112 62 105Q33 72 42 45Q69 79 94 83Q80 54 100 40Q105 88 122 110Q140 83 139 41Q157 58 149 85Q178 74 201 46Q208 80 183 105Q198 108 215 86Q196 161 135 148Z',ivory,'stroke="#FFF4D5" stroke-width="1.5"')+path('M43 72Q73 128 105 122M38 103Q75 145 108 137M198 72Q174 121 137 124M207 105Q174 143 135 137','none','stroke="#CDB8C8" stroke-width="3"'); }
function ring() { return circle(120,142,42,'none',`stroke="${edge}" stroke-width="16"`)+circle(120,139,42,'none',`stroke="${gold}" stroke-width="12"`)+path('M87 94L98 71L142 71L154 94L121 122Z',glass,'stroke="#E5F9FF" stroke-width="2"')+path('M98 71L108 94L121 122L131 94L142 71M87 94L154 94','none','stroke="#FFF" stroke-width="2"')+star(159,67,10)+path('M90 136Q92 110 111 104','none','stroke="#FFF3C9" stroke-width="3"'); }
function trophy() { return path('M83 81L56 81Q38 147 93 145L97 127Q64 124 68 94L84 94M157 81L184 81Q202 147 147 145L143 127Q176 124 172 94L156 94',gold)+path('M80 67L160 67L155 117Q151 143 130 149L130 175L153 183L159 199L81 199L87 183L110 175L110 149Q88 143 85 117Z',gold)+rect(78,61,84,15,5,gold)+path('M96 80L100 112Q101 129 115 134','none','stroke="#FFF4C9" stroke-width="5" stroke-linecap="round"')+gem(121,108,16)+rect(95,185,50,9,2,edge); }
function castle() { let out=path('M38 197L42 108L77 108L78 196Z',body)+path('M162 195L164 105L199 105L202 197Z',body)+path('M68 196L71 132L169 132L173 197Z','url(#soft)')+rect(97,81,46,113,2,body); for(const [x,y,w] of [[37,108,43],[93,81,54],[159,105,44]]) out+=path(`M${x-5} ${y}L${x+w/2} ${y-50}L${x+w+5} ${y}Z`,gold)+line(x+w/2,y-50,x+w/2,y-69,edge,2)+path(`M${x+w/2} ${y-69}l18 5l-18 8Z`,pink);return out+[56,117,178].map((x,i)=>rect(x,i===1?108:136,10,20,5,ivory)).join('')+path('M105 197L105 170Q120 147 135 170L135 197Z',gold)+path('M26 199Q119 215 213 199L203 212L39 212Z',gold); }
function cake() { return path('M49 185Q120 208 191 185L184 198Q120 218 57 198Z',gold)+rect(57,125,126,60,12,body)+rect(72,93,96,39,10,'url(#soft)')+path('M57 133Q61 119 78 124Q92 138 105 125Q120 139 136 126Q154 140 168 124Q180 122 183 134L183 149Q169 153 166 141Q150 152 141 141Q126 154 117 141Q98 151 89 140Q73 153 57 145Z',ivory)+rect(112,63,15,33,4,gold)+path('M120 39Q105 57 119 64Q134 58 120 39Z',pink)+[83,148].map(x=>bloom(x,100,12)).join('')+heart(120,162,.23); }
function balloon() { return path('M123 135Q96 168 129 185Q156 204 117 221','none','stroke="#C2AFA1" stroke-width="2"')+path('M120 42C176 41 187 120 126 148L116 148C51 123 65 40 120 42Z',body)+path('M113 146L105 160L135 160L126 146Z',gold)+path('M89 89Q89 62 109 59','none','stroke="#FFFFFFA0" stroke-width="7" stroke-linecap="round"')+heart(122,103,.37); }
function frame() { return rect(47,50,146,156,25,gold)+rect(54,57,132,141,20,edge)+rect(61,64,118,128,17,glass)+path('M62 165Q101 123 137 164L178 192L62 192Z',body)+circle(120,112,24,ivory)+group(crown(),'translate(74 1) scale(.38)')+[ [51,54],[188,55],[50,200],[190,198] ].map(([x,y])=>gem(x,y,10)).join('')+path('M74 74L161 74','none','stroke="#FFF8D2" stroke-width="2"'); }
function chest() { return path('M51 114Q51 67 119 67Q187 67 188 114Z',body)+rect(50,111,139,83,9,'url(#soft)')+path('M50 126L189 126L189 145L50 145Z',gold)+rect(60,109,12,83,2,gold)+rect(168,109,12,83,2,gold)+rect(104,121,33,39,7,gold)+circle(121,136,6,edge)+rect(118,137,6,11,2,edge)+path('M69 88Q120 60 172 90','none','stroke="#FFFFFF66" stroke-width="4"')+gem(121,95,11); }
function key() { return group(circle(0,0,30,'none',`stroke="${edge}" stroke-width="17"`)+circle(0,-2,30,'none',`stroke="${gold}" stroke-width="12"`)+rect(-7,27,14,87,3,gold)+path('M0 76L27 76L27 91L11 91L11 107L-1 107Z',gold)+gem(0,-1,14), 'translate(100 82) rotate(-33)'); }
function crystal() { return path('M79 70L123 40L166 76L157 148L122 193L86 149Z',body,'stroke="#F4E9FF" stroke-width="2"')+path('M123 40L108 101L122 193L140 101Z','#FFFFFF70')+path('M79 70L108 101L86 149M166 76L140 101L157 148M108 101L140 101','none','stroke="#FFFFFF80" stroke-width="2"')+path('M66 183L122 166L179 183L161 206L85 206Z',gold)+star(177,60,9)+star(61,122,6); }
function music() { return path('M100 67L177 48L177 153Q157 181 135 164Q119 146 150 131L161 130L161 83L114 95L114 175Q90 206 69 183Q58 166 83 154L99 153Z',gold)+path('M114 75L161 64L161 75L114 87Z',body)+path('M64 77Q39 98 59 120M55 61Q18 100 48 137','none','stroke="url(#body)" stroke-width="5" stroke-linecap="round"')+star(193,102,7); }
function ship() { return path('M40 163L199 163L172 193L69 193Z',body)+path('M48 175L186 175L174 185L64 185Z',gold)+path('M108 62L109 160M152 84L153 159','none','stroke="#EBD6BC" stroke-width="4"')+path('M101 68L54 151L101 151Z',ivory)+path('M117 65L117 150L156 149Z',gold)+path('M161 89L161 153L188 153Z',ivory)+path('M40 204Q60 192 80 204T120 204T160 204T200 204','none','stroke="#85C2CB" stroke-width="5" stroke-linecap="round"'); }
function car() { return path('M41 142L57 116L88 112L107 89L154 89L178 119L199 133L200 174L39 174Z',body)+path('M90 118L112 96L148 96L165 118Z',glass)+line(124,97,124,118,'#FFF7D6',3)+path('M42 145L198 145','none','stroke="#FFF4C7" stroke-width="3"')+rect(42,147,22,10,4,ivory)+rect(179,145,17,10,4,ivory)+[75,166].map(x=>circle(x,174,23,'#2D2940')+circle(x,174,14,gold)+circle(x,174,5,'#564258')).join('')+path('M53 136Q84 127 185 132','none','stroke="#FFFFFF70" stroke-width="3"'); }
function bird(swan=false) { return swan?path('M60 159Q74 120 123 147Q143 150 149 131L148 84Q148 56 169 55Q187 55 187 70L175 77Q165 72 163 83L165 135Q159 190 100 191Q68 191 48 171Z',ivory)+path('M178 64L202 71L180 78Z',gold)+circle(173,65,3,'#2D2940')+path('M72 152Q89 114 127 132Q146 158 87 176Z',glass)+path('M91 147Q106 139 121 143','none','stroke="#FFF" stroke-width="4"'):path('M44 118Q61 116 99 136Q84 89 107 50Q126 93 144 122Q161 78 193 69Q202 107 170 141Q192 151 202 174Q162 177 142 163Q111 187 64 179L84 155Z',ivory)+path('M106 76Q118 111 141 137M183 88Q177 116 152 140','none','stroke="#C1AACD" stroke-width="4"')+circle(150,144,3,'#514257')+path('M162 146L180 151L163 155Z',gold); }
function animal(kind='cat') { const cat=kind==='cat'||kind==='dog'; return (kind==='lion'?circle(120,126,73,gold):'')+path(cat?'M60 110L55 57L99 82Q121 72 142 82L184 57L180 116Z':'M60 115L68 65L103 88Q123 79 140 89L175 65L183 115Z',body)+path('M64 110Q120 59 177 109L182 151Q165 196 121 198Q76 196 58 153Z',body)+path('M70 88L72 105L89 90M159 91L172 108L171 83','none','stroke="#FFD8C6" stroke-width="7" stroke-linecap="round"')+path('M80 145Q98 127 112 145M133 145Q148 128 165 146','none','stroke="#463449" stroke-width="5" stroke-linecap="round"')+path('M107 160Q120 148 133 160L121 172Z',pink)+path('M102 178Q120 191 138 177','none','stroke="#71525F" stroke-width="3"')+circle(83,160,10,'#FFCAD755')+circle(158,161,10,'#FFCAD755'); }
function unicorn() { return path('M71 185Q70 121 106 89Q127 57 158 74L180 112L166 136L140 125L145 187Z',ivory)+path('M106 93Q90 57 133 50L159 76Q119 78 112 116Q100 146 108 187L72 187Z',body)+path('M146 75L147 33L159 81Z',gold)+path('M160 83L161 59L174 90Z',ivory)+circle(153,103,4,'#4A3651')+path('M161 118L172 119','none','stroke="#BDA2BF" stroke-width="3"')+path('M85 123Q84 81 122 75','none','stroke="#FFFFFF88" stroke-width="5"'); }
function dessert(kind) { if(kind==='doughnut')return circle(120,132,69,'#D18A52')+circle(120,125,64,gold)+path('M60 111Q64 64 119 64Q176 66 184 115Q166 100 157 118Q146 137 132 121Q117 109 104 129Q90 144 82 124Q74 107 60 111Z',pink)+circle(120,129,20,'#3C2A47')+Array.from({length:9},(_,i)=>line(76+i*10,91+Math.sin(i*4)*15,81+i*10,96+Math.sin(i*4)*15,i%2?'#FFE8AD':'#FFF5EB',3)).join(''); if(kind==='lollipop') return rect(115,129,11,82,4,ivory)+circle(120,101,58,body)+path('M108 109C87 95 119 62 137 88C160 122 88 142 80 102C72 53 162 51 167 101','none','stroke="#FFF0DF" stroke-width="12" stroke-linecap="round"')+path('M94 163L120 178L142 161L145 189L119 182L91 192Z',gold);return path('M82 136L120 214L159 136Z',gold)+path('M96 152L135 190M106 140L147 175M137 145L105 184','none','stroke="#C08E4A" stroke-width="3"')+circle(120,117,49,pink)+circle(101,99,25,'url(#soft)')+circle(142,99,25,body)+path('M90 104Q91 83 107 83','none','stroke="#FFF2E7" stroke-width="5" stroke-linecap="round"'); }
function cup(juice=false) { return juice?path('M80 75L161 75L152 198L89 198Z',glass,'stroke="#FFEDD8" stroke-width="2"')+path('M86 111L156 111L148 190L94 190Z',gold)+line(136,46,122,154,'#FF9DAB',7)+circle(81,95,27,'#FFB660')+circle(81,95,21,'#FFE5A3')+path('M81 75L81 115M61 95L101 95','none','stroke="#F5A34E" stroke-width="2"'):path('M65 105L157 105L151 160Q112 189 72 161Z',ivory)+path('M156 116Q201 111 182 149Q173 164 151 154','none',`stroke="${gold}" stroke-width="11"`)+`<ellipse cx="112" cy="105" rx="46" ry="12" fill="#A66A50"/>`+path('M50 181Q112 204 177 181L168 192Q112 211 61 193Z',gold)+path('M95 84Q82 68 98 54M124 80Q109 64 126 48','none','stroke="#DBC9DF" stroke-width="4" stroke-linecap="round"'); }
function book() { return path('M58 67Q91 56 119 76Q151 57 181 66L181 188Q150 177 120 195Q86 178 58 188Z',body)+path('M65 58Q95 56 120 74Q147 55 175 59L175 179Q147 176 120 191Q90 175 65 178Z',ivory)+path('M120 74L120 191','none','stroke="#C8ABAF" stroke-width="3"')+[90,105,120,135,150].map(y=>path(`M75 ${y}Q94 ${y-4} 109 ${y+5}M133 ${y+5}Q151 ${y-4} 165 ${y}`,'none','stroke="#D2BCAD" stroke-width="2"')).join('')+gem(121,126,20)+star(183,47,10); }
function rocket() { return path('M100 155Q69 151 70 195L104 178Z',body)+path('M140 155Q171 151 170 195L136 178Z',body)+path('M120 40Q72 88 94 171L146 171Q166 91 120 40Z',ivory)+path('M120 40Q138 62 147 86L93 86Q102 59 120 40Z',body)+circle(120,111,24,gold)+circle(120,111,17,glass)+path('M101 171L139 171L133 188L108 188Z',gold)+path('M107 191Q120 230 134 191Z',pink)+path('M105 91Q97 120 106 151','none','stroke="#FFF" stroke-width="4"'); }
function lamp() { return path('M53 140Q28 97 67 101L76 114Q47 110 62 132Z',gold)+path('M66 121Q123 99 175 116Q194 111 210 94Q208 125 178 137Q148 178 112 169L111 181L137 190L83 190L101 179L101 166Q77 155 66 121Z',gold)+path('M103 109Q103 85 130 85L154 109Z',body)+circle(129,82,7,gold)+path('M86 128Q121 150 154 129','none','stroke="#FFF4C9" stroke-width="4"')+path('M164 74Q130 38 164 30Q181 28 172 45Q143 57 179 76','none','stroke="#B59BE3" stroke-width="7" stroke-linecap="round"'); }
function lock() { return path('M83 109L83 82Q120 26 157 82L157 109','none',`stroke="${edge}" stroke-width="17"`)+path('M85 110L85 82Q120 35 155 82L155 110','none',`stroke="${gold}" stroke-width="12"`)+rect(67,102,106,93,20,body)+heart(120,145,.42)+circle(120,146,7,edge)+rect(117,149,6,15,2,edge); }
function camera() { return rect(48,88,145,100,17,body)+rect(76,73,50,25,6,gold)+rect(56,99,129,23,4,'#FFFFFF21')+circle(122,139,42,gold)+circle(122,139,33,'#382D50')+circle(122,139,24,glass)+circle(116,131,7,'#FFFFFF99')+rect(162,103,17,10,3,ivory)+rect(57,130,14,42,4,edge); }
function wheel() { return circle(120,120,72,gold)+circle(120,120,61,'none',`stroke="#7A5568" stroke-width="3"`)+Array.from({length:8},(_,i)=>group(path('M120 120L98 55L143 55Z',i%2?body:ivory),'rotate('+i*45+' 120 120)')).join('')+circle(120,120,18,gold)+gem(120,120,10)+path('M113 34L127 34L120 60Z',pink)+path('M105 191L135 191L147 210L93 210Z',gold); }
function bicycle() {return [65,174].map(x=>circle(x,163,36,'none',`stroke="${edge}" stroke-width="7"`)+circle(x,163,31,'none',`stroke="${gold}" stroke-width="3"`)+[0,45,90,135].map(i=>group(line(x-27,163,x+27,163,'#E5CBD9',1.5),`rotate(${i} ${x} 163)`)).join('')).join('')+path('M65 163L94 114L128 163L65 163L111 163L155 105L174 163M155 105L152 87L139 87M86 112L104 112','none',`stroke="${gold}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`)+path('M156 98L186 98L180 124L160 124Z',body)+bloom(168,85,13)+bloom(183,88,10); }
function bell() { return path('M64 164Q85 143 84 111Q81 68 120 65Q159 68 156 111Q155 143 176 164Z',gold)+`<ellipse cx="120" cy="166" rx="56" ry="11" fill="${edge}"/>`+circle(120,171,15,gold)+circle(120,59,9,gold)+path('M99 91Q91 112 96 137','none','stroke="#FFF3C8" stroke-width="5" stroke-linecap="round"')+path('M94 59Q73 38 65 57Q62 74 94 72Q114 45 139 45Q166 46 153 62Q142 75 121 67Z',pink); }
function planet() {return circle(122,119,61,body)+path('M80 86Q104 64 128 67','none','stroke="#FFFFFF8F" stroke-width="5" stroke-linecap="round"')+`<ellipse cx="122" cy="126" rx="103" ry="29" fill="none" stroke="${gold}" stroke-width="10" transform="rotate(-26 122 126)"/>`+path('M75 111Q117 156 175 119L164 155Q133 190 98 174Z',body)+star(187,55,10)+star(54,190,7); }
function mask() {return path('M43 100Q61 78 93 97Q120 111 145 98Q175 77 199 101L184 150Q163 171 129 149L120 144L110 150Q73 171 54 148Z',body,'stroke="#E8C391" stroke-width="4"')+path('M68 118Q84 106 104 124Q84 146 68 118ZM136 124Q155 104 177 117Q158 145 136 124Z','#F5E9E1')+path('M50 105Q86 84 113 113M127 112Q160 85 193 106','none',`stroke="${gold}" stroke-width="5"`)+gem(120,113,10)+path('M116 105Q92 69 112 38Q124 66 124 95Q139 61 170 48Q165 80 132 106Z',gold); }
function shoe() {return path('M83 74L135 74L136 127Q150 149 181 149Q206 151 201 179L169 192L52 192L55 155Q63 143 79 143Z',gold)+path('M54 177L202 177L202 191L51 199Z',edge)+path('M88 86L124 86L122 130L89 133Z',body)+path('M94 96L117 96M93 108L116 108M92 120L114 120','none','stroke="#FFF2D5" stroke-width="3"')+star(170,133,8); }
function sword() {return group(path('M120 28L140 70L128 159L112 159L100 70Z',ivory)+path('M120 28L120 158L131 70Z',glass)+path('M83 152L157 152L164 168L76 168Z',gold)+rect(111,165,18,42,5,body)+gem(120,160,12)+circle(120,213,11,gold),'rotate(26 120 120)'); }
function flowerTree() {return path('M109 185L116 114L128 114L133 185Z',gold)+path('M82 184L158 184L147 210L93 210Z',body)+path('M119 147L88 114M124 125L150 96','none','stroke="#317F63" stroke-width="5"')+bloom(89,105,26)+bloom(148,91,29)+bloom(117,64,30)+bloom(121,112,29); }
function snowflake() {return group(Array.from({length:6},(_,i)=>group(path('M120 120L120 43M120 71L103 55M120 71L137 55M120 91L99 74M120 91L141 74','none',`stroke="${glass}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`),`rotate(${i*60} 120 120)`)).join('')+gem(120,120,22),'rotate(15 120 120)'); }
function umbrella() {return path('M35 123Q45 47 120 45Q198 48 207 123Q181 102 152 123Q120 103 90 123Q64 103 35 123Z',body)+path('M120 45Q87 78 90 123M120 45Q153 78 152 123','none','stroke="#FFE3E9AA" stroke-width="3"')+path('M120 40L120 186Q121 214 143 199L149 192','none',`stroke="${gold}" stroke-width="7" stroke-linecap="round"`)+heart(120,91,.23); }
function jar() {return rect(86,55,67,24,7,gold)+path('M90 80L90 95Q63 109 67 149L73 190Q120 212 168 189L174 146Q177 110 150 95L150 80Z',glass,'stroke="#FFF0DEAA" stroke-width="2"')+Array.from({length:8},(_,i)=>heart(93+(i%3)*27,134+Math.floor(i/3)*20,.17)).join('')+path('M85 115L80 166','none','stroke="#FFFFFF99" stroke-width="4" stroke-linecap="round"')+path('M92 71L149 71','none','stroke="#FFF1B9" stroke-width="3"'); }
function sofa() {return rect(58,78,124,77,20,body)+rect(46,118,149,66,20,'url(#soft)')+rect(43,113,29,68,13,body)+rect(169,113,29,68,13,body)+line(120,88,120,143,'#FFFFFF44',3)+path('M61 184L61 198M181 184L181 198','none',`stroke="${gold}" stroke-width="9"`)+rect(76,125,88,38,10,body)+path('M82 133L157 133','none','stroke="#FFFFFF55" stroke-width="3"'); }
function firework() {return Array.from({length:12},(_,i)=>group(path('M120 101L120 62M120 49L120 43','none',`stroke="${i%2?'url(#body)':'url(#gold)'}" stroke-width="5" stroke-linecap="round"`),`rotate(${i*30} 120 110)`)).join('')+star(120,109,17)+group(rocket(),'translate(83 103) scale(.4)'); }
function lampLight() {return path('M85 88L155 88L177 161L63 161Z',glass,'stroke="#FFE6C8" stroke-width="3"')+path('M87 85L153 85L147 66L94 66Z',gold)+path('M97 65Q94 31 120 32Q147 33 144 65','none',`stroke="${gold}" stroke-width="5"`)+rect(68,163,104,20,8,gold)+path('M113 156L112 121Q120 96 128 121L128 156Z',gold)+circle(120,125,17,'#FFE4A755'); }
function thumbs() {return path('M94 116L116 74Q115 41 134 46Q156 55 142 101L178 100Q202 98 198 122L181 178Q178 192 160 194L96 183Z',ivory,'stroke="#C4A38C" stroke-width="2"')+rect(54,112,44,78,11,body)+rect(64,172,20,6,3,gold)+path('M112 117L169 119M105 173L158 181','none','stroke="#FFF" stroke-width="4" stroke-linecap="round"'); }
function arrow() {return group(path('M42 128L179 128M142 102L188 128L142 154','none',`stroke="${gold}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`)+path('M67 129L44 105L29 105L51 129L29 151L44 151Z',body)+heart(122,118,.55),'rotate(-25 120 120)'); }
function house() {return path('M57 119L121 67L186 119L181 198L62 198Z',ivory)+path('M44 122L120 56L198 121L187 135L120 81L54 135Z',body)+rect(135,55,21,34,3,gold)+rect(102,147,35,51,13,body)+rect(73,137,19,24,5,glass)+rect(151,137,19,24,5,glass)+line(81,137,81,160,'#FFF7E7',2)+line(159,137,159,160,'#FFF7E7',2)+path('M48 199L194 199L204 209L38 209Z',gold)+bloom(177,188,12); }
function orb() {return circle(120,109,68,glass,'stroke="#E1EFFF99" stroke-width="2"')+path('M78 90Q83 57 117 54','none','stroke="#FFF9FC" stroke-width="5" stroke-linecap="round"')+star(126,103,21,body)+star(162,125,8,gold)+circle(93,129,6,'#E8D6FF')+path('M87 169L153 169L175 194L65 194Z',gold)+rect(64,194,111,12,5,edge)+path('M86 184L154 184','none','stroke="#FFF1C9" stroke-width="3"'); }
function lips() {return path('M41 121Q74 87 97 94L119 104L141 93Q164 85 199 121Q173 170 122 171Q69 171 41 121Z',pink)+path('M41 121Q84 129 120 119Q155 129 199 121Q161 145 122 145Q82 145 41 121Z','#913C5F')+path('M58 117Q80 101 95 103M92 154Q118 165 148 151','none','stroke="#FFE0DE99" stroke-width="5" stroke-linecap="round"'); }
function medal() {return path('M79 47L108 47L142 114L110 125Z',body)+path('M132 47L161 47L132 124L104 110Z','url(#soft)')+circle(120,147,50,gold)+circle(120,147,39,'none',`stroke="${edge}" stroke-width="2"`)+star(120,147,24,ivory)+path('M91 123Q104 109 123 110','none','stroke="#FFF6CB" stroke-width="3"'); }
function scepter() {return group(rect(113,87,14,121,4,gold)+circle(120,74,34,gold)+circle(120,74,25,glass)+gem(120,74,17)+path('M80 76L91 107L148 107L160 76L143 89L120 53L98 88Z',gold)+circle(120,207,12,body),'rotate(22 120 120)'); }
function watering() {return path('M73 108Q26 67 51 55Q82 43 95 100','none',`stroke="${gold}" stroke-width="9"`)+path('M71 91L147 91L157 179Q115 202 66 178Z',body)+path('M148 143L180 95L204 102L160 162Z',gold)+`<ellipse cx="201" cy="100" rx="11" ry="20" fill="${ivory}" transform="rotate(-30 201 100)"/>`+bloom(112,139,22)+path('M77 111L75 163','none','stroke="#FFFFFF66" stroke-width="4"')+path('M199 129L204 144M209 122L219 136','none','stroke="#B7D8DE" stroke-width="3" stroke-linecap="round"'); }
function chandelier() {return path('M120 35L120 145M72 103Q70 144 120 145Q171 144 169 103M50 130Q52 174 120 173Q188 171 191 130','none',`stroke="${gold}" stroke-width="7" stroke-linecap="round"`)+[ [72,95],[169,95],[51,123],[191,123] ].map(([x,y])=>rect(x-5,y-21,10,27,3,ivory)+path(`M${x} ${y-39}q-11 15 0 20q12-5 0-20Z`,gold)).join('')+[ [83,170],[120,183],[158,170] ].map(([x,y])=>gem(x,y,11)).join('')+circle(120,147,15,body); }
function dragon() {return path('M54 177Q81 188 101 166Q115 148 104 127Q68 114 77 80Q85 49 119 65L147 44L142 79Q180 87 177 109L153 124L140 118Q164 159 140 188Q110 220 65 196Z',body)+path('M109 138Q155 94 185 52L184 127L154 132L148 151Z',gold)+path('M102 143Q73 103 44 82L49 148L77 143L91 166Z',gold)+path('M82 89Q74 69 92 66M99 168Q115 181 98 193','none','stroke="#FFFFFF88" stroke-width="4"')+circle(137,91,4,'#F6E8BD')+path('M151 113L196 124L170 103Z',pink)+path('M81 64L93 45L103 67Z',gold); }
function purse() {return path('M81 100Q78 51 120 50Q160 50 159 100','none',`stroke="${gold}" stroke-width="9"`)+path('M61 94L180 94L191 192Q121 210 50 191Z',body)+path('M59 98L120 146L183 98Z','url(#soft)')+gem(120,144,14)+path('M69 151L64 180M172 153L177 180','none','stroke="#FFFFFF44" stroke-width="3"'); }
function pulse() {return path('M43 134L80 134L93 104L110 165L127 85L145 134L197 134','none',`stroke="${gold}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`); }
function tears() {return [75,166].map(x=>path(`M${x} 147q-18 26 0 28q18-2 0-28Z`,glass)).join(''); }
function keyboard() {return rect(38,172,164,39,9,ivory)+Array.from({length:10},(_,i)=>rect(46+i*15,178,10,12,2,i%3?'#A798B5':body)).join('')+rect(86,196,70,5,2,'#C5B4CA'); }
function wine() {return path('M81 49L160 49L156 113Q151 147 127 148L127 187L158 199L158 205L81 205L81 199L112 187L112 148Q88 142 85 113Z',glass)+path('M86 95L156 95L153 114Q146 147 121 142Q95 143 88 115Z',pink)+path('M95 59L98 102','none','stroke="#FFFFFFBB" stroke-width="4" stroke-linecap="round"'); }

// Art-directed compositions for gifts whose names call for a specific silhouette.
function special(g) {
  switch(g.id) {
    case 'accompany': return ['paired-hearts',heart(87,134,.67)+heart(155,114,.67)+path('M81 172Q119 211 165 156','none',`stroke="${gold}" stroke-width="3"`)];
    case 'become-a-couple':return ['couple',heart(79,122,.68)+heart(161,122,.68)+gem(120,164,13)];
    case 'carousel-love':return ['carousel',castle()+group(unicorn(),'translate(63 111) scale(.43)')];
    case 'frog-heart':return ['frog',circle(119,143,62,'url(#leaf)')+circle(78,96,27,'url(#leaf)')+circle(161,96,27,'url(#leaf)')+circle(78,96,18,ivory)+circle(161,96,18,ivory)+circle(80,97,7,'#303345')+circle(158,97,7,'#303345')+heart(120,155,.34)];
    case 'heart-to-heart':return ['heart-link',heart(84,113,.65)+heart(155,140,.65)+line(83,162,156,92,'#EBC88A',4)];
    case 'i-love-you':return ['heart-note',envelope()+heart(120,101,.55)];
    case 'love-of-flames':return ['flame-heart',path('M120 31Q139 69 163 83Q197 120 169 168Q121 224 71 172Q47 142 74 107L96 72L92 116Q130 101 120 31Z',gold)+heart(122,143,.7)];
    case 'love-heart':return ['heart-pendant',circle(120,124,73,'none',`stroke="${gold}" stroke-width="7"`)+heart(120,130,.85)];
    case 'dynamic-heart':return ['pulse-heart',heart(120,122,1.1)+pulse()];
    case 'heartbeat-test':return ['pulse',heart(120,91,.65)+pulse()+circle(120,192,8,body)];
    case 'love-balance':return ['balance',path('M120 59L120 191M61 99L179 99M77 200L165 200','none',`stroke="${gold}" stroke-width="7" stroke-linecap="round"`)+path('M61 100L38 157L85 157ZM179 100L157 157L202 157Z','none',`stroke="${gold}" stroke-width="2"`)+heart(61,147,.33)+heart(180,147,.33)+gem(120,87,12)];
    case 'love-charger':return ['charger',rect(67,66,107,131,16,gold)+rect(77,76,87,111,10,glass)+rect(101,52,39,16,4,gold)+heart(120,127,.56)+path('M129 106L110 136L125 136L114 157L143 122L128 122Z',ivory)];
    case 'angel':return ['angel',wings()+circle(121,105,23,ivory)+path('M120 122L93 183L150 183Z',ivory)+`<ellipse cx="120" cy="65" rx="24" ry="8" fill="none" stroke="${gold}" stroke-width="4"/>`];
    case 'magical-fairy':return ['fairy',group(wings(),'translate(34 42) scale(.72)')+group(scepter(),'translate(44 29) scale(.7)')+star(82,70,13,body)+star(55,99,8)];
    case 'peacock':return ['peacock',Array.from({length:7},(_,i)=>group(path('M120 162Q82 95 120 41Q157 95 120 162Z','url(#leaf)')+gem(120,78,16),`rotate(${(i-3)*24} 120 161)`)).join('')+path('M100 165Q119 125 139 158L139 185L93 185Z',glass)+path('M124 146L124 122Q134 101 148 119L137 132L139 166Z',body)];
    case 'big-eye-cat':return ['cat-eyes',animal()+circle(96,139,17,ivory)+circle(145,139,17,ivory)+circle(98,141,9,'#4F3A63')+circle(143,141,9,'#4F3A63')];
    case 'crying-cat':return ['cat-tears',animal()+tears()];
    case 'favorite-hug':return ['hug',group(animal(),'translate(1 50) scale(.73)')+group(animal(),'translate(72 41) scale(.73)')+heart(125,175,.3)];
    case 'keyboard-cat':return ['cat-keyboard',group(animal(),'translate(22 1) scale(.85)')+keyboard()];
    case 'rain-fan-cat':return ['cat-umbrella',group(umbrella(),'translate(-6 -15) scale(.9)')+group(animal(),'translate(56 83) scale(.6)')];
    case 'sleepy-shiba-inu':return ['shiba',animal('dog')+path('M91 160Q121 140 151 160L138 184L101 183Z',ivory)+circle(121,164,8,'#49364B')+path('M104 185L136 185','none','stroke="#9D7B72" stroke-width="3"')];
    case 'cute-pet-girl':return ['bow-cat',animal()+path('M122 76L94 50L94 85L122 76L151 51L154 87Z',gold)+gem(123,76,8)];
    case 'bounty-time':return ['hourglass',path('M72 46L169 46L167 66L75 66ZM71 190L169 190L173 207L68 207Z',gold)+path('M85 68Q89 100 115 126Q90 150 84 189L157 189Q150 150 126 126Q153 99 157 68Z',glass)+path('M95 157L146 185L94 185Z',body)+path('M102 79L141 79L121 108Z',gold)];
    case 'colors-of-india':return ['lotus',path('M45 94Q60 57 121 66Q179 53 196 94L184 135Q118 170 54 135Z',ivory)+path('M45 94Q92 58 121 89Q164 58 196 94L190 109Q149 81 121 107Q87 79 50 109Z','#D7A36A')+path('M55 137Q118 164 184 137L172 159Q119 187 67 159Z','url(#leaf)')+bloom(120,117,24)];
    case 'diy-gift':return ['diy',box()+group(path('M101 54L120 45L151 158L136 172Z',gold)+path('M136 172L151 158L153 189Z',ivory),'rotate(12 120 120)')];
    case 'stage':return ['stage',rect(39,64,161,137,3,'#483248')+path('M35 63L107 63Q81 124 39 164ZM133 63L204 63L199 164Q152 125 133 63Z',body)+path('M33 61Q118 27 207 61L207 80Q122 61 33 80Z',gold)+rect(30,198,180,13,3,gold)+group(music(),'translate(67 69) scale(.45)')];
    case 'stellar-ring-box':return ['ringbox',group(box(),'translate(22 68) scale(.82)')+group(ring(),'translate(56 -11) scale(.58)')];
    case 'floating-roses':return ['floating-roses',group(rose(),'translate(-10 26) scale(.65)')+group(rose(),'translate(64 2) scale(.72)')+group(rose(),'translate(114 71) scale(.49)')];
    case 'passionate-rose':return ['passionate-rose',rose()+heart(183,159,.34)+bloom(100,101,24)];
    case 'rose-wine':return ['wine',wine()+group(rose(),'translate(125 84) scale(.42)')];
    case 'love-rhythm':return ['rhythm',music()+heart(70,171,.34)];
    case 'love-song':return ['love-song',heart(120,126,.94)+group(music(),'translate(95 84) scale(.4)')];
    case 'sound-of-love':return ['radio',rect(47,85,148,110,14,body)+circle(101,143,34,gold)+circle(101,143,25,'#4E3B56')+circle(101,143,13,glass)+rect(147,107,32,10,3,ivory)+circle(156,146,10,gold)+path('M63 85L177 57','none',`stroke="${gold}" stroke-width="4"`)];
  }
  return null;
}

function motif(g) {
  const n=g.id;
  const custom=special(g); if(custom)return custom;
  if(g.customizable) {
    const kind=/star/.test(n)?'star':/fame|champion/.test(n)?'laurel':/diamond/.test(n)?'diamond':'royal';
    const decoration=kind==='star'?star(120,171,23):kind==='diamond'?gem(120,173,22):kind==='laurel'?path('M69 175Q40 120 78 85M171 175Q200 120 163 85','none',`stroke="${gold}" stroke-width="6" stroke-dasharray="8 5"`):group(crown(),'translate(80 119) scale(.33)');
    return ['frame',frame()+decoration];
  }
  if(/portrait|signature|spotlight/.test(n)) return ['frame',frame()];
  if(/rose-cake/.test(n)) return ['cake',cake()+group(bloom(120,90,20),'translate(58 19) scale(.52)')];
  if(/heart-box/.test(n)) return ['heartbox',box()+heart(121,145,.35)];
  if(/crystal-ball/.test(n)) return ['orb',orb()];
  if(/gift-planet/.test(n)) return ['planet',planet()+group(box(),'translate(122 138) scale(.28)')];
  if(/moon-bell/.test(n)) return ['bell',bell()+path('M173 40Q150 49 165 71Q144 75 140 58Q136 39 159 33Z',gold)];
  if(/firework-cruise/.test(n)) return ['ship',ship()+group(firework(),'translate(0 -7) scale(.55)')];
  if(/holy-grail/.test(n)) return ['grail',path('M77 63L164 63L157 120Q155 143 130 148L131 181L153 192L153 201L86 201L86 192L109 181L110 149Q89 144 85 121Z',gold)+path('M93 76L98 111Q99 127 111 132','none','stroke="#FFF1BD" stroke-width="5"')+gem(121,107,17)];
  if(/hands/.test(n)) return ['heartHands',heart(120,111,.75)+path('M45 134L67 123L99 155L112 180L95 201L74 181ZM195 134L173 123L141 155L128 180L145 201L166 181Z',ivory)];
  if(/heart-wings|wings-of-heart/.test(n)) return ['heartWings',wings()+heart(121,132,.7)];
  if(/kiss|lips/.test(n)) return ['lips',lips()];
  if(/medal|golden-signature/.test(n)) return ['medal',medal()];
  if(/scepter/.test(n)) return ['scepter',scepter()];
  if(/watering/.test(n)) return ['watering',watering()];
  if(/small-house|sweet-home|beach-house/.test(n)) return ['house',house()];
  if(/fata-morgana/.test(n)) return ['castle',castle()];
  if(/envelope|letter|confession-letter/.test(n)) return ['envelope',envelope()];
  if(/paper-plane/.test(n)) return ['plane',group(envelope(),'translate(0 10)')+path('M35 87L204 51L147 135L118 112L79 136L82 101Z',ivory)+path('M82 101L204 51L118 112L114 139L147 135','none',`stroke="${edge}" stroke-width="2"`)];
  if(/bicycle/.test(n)) return ['bicycle',bicycle()];
  if(/wheel/.test(n)) return ['wheel',wheel()];
  if(/wing-bottle/.test(n)) return ['bottle',bottle(true)];
  if(/bottle/.test(n)) return ['bottle',bottle()];
  if(/bell|wind-chime/.test(n)) return ['bell',bell()];
  if(/cruise|boat|ship|yacht|rowing/.test(n)) return ['ship',ship()];
  if(/grail|trophy|champion-frame/.test(n)) return ['trophy',trophy()];
  if(/crown|crowning/.test(n)) return ['crown',crown()];
  if(/chest/.test(n)) return ['chest',chest()];
  if(/key/.test(n) && !/keyboard/.test(n)) return ['key',key()];
  if(/crystal|diamond|enchantress/.test(n)) return ['crystal',crystal()];
  if(/box|gift|celebration|parcel|opening/.test(n)) return ['box',box()];
  if(/rose|bloom|bouquet|flower|garden|watering/.test(n)) return ['flower',/bouquet|bloom|flower|garden|watering/.test(n)?bouquet():rose()];
  if(/arrow/.test(n)) return ['arrow',arrow()];
  if(/balloon/.test(n)) return ['balloon',balloon()];
  if(/cake|birthday|wedding|carnival|dessert-cart/.test(n)) return ['cake',cake()];
  if(/ring|marry|necklace/.test(n)) return ['ring',ring()];
  if(/lock/.test(n)) return ['lock',lock()];
  if(/castle|house|home|palace|superior|pinnacle/.test(n)) return ['castle',castle()];
  if(/carriage|wagon/.test(n)) return ['carriage',car()+group(crown(),'translate(65 14) scale(.46)')];
  if(/car|camera/.test(n) && !/carpet|carousel/.test(n)) return /camera/.test(n)?['camera',camera()]:['car',car()];
  if(/photograph/.test(n)) return ['camera',camera()];
  if(/swan|pigeon|bird|flying|wing|phoenix|fairy|angel|peacock|hawk/.test(n)) return ['bird',/swan/.test(n)?bird(true):bird()];
  if(/unicorn|mount/.test(n)) return ['unicorn',unicorn()];
  if(/cat|kitten|shiba|wolf|lion|woodland|hug/.test(n)) return ['animal',animal(/lion/.test(n)?'lion':/wolf/.test(n)?'wolf':/shiba/.test(n)?'dog':'cat')];
  if(/dragon/.test(n)) return ['dragon',dragon()];
  if(/doughnut/.test(n)) return ['doughnut',dessert('doughnut')];
  if(/lollipop|lolly|cotton-candy/.test(n)) return ['lollipop',dessert('lollipop')];
  if(/ice-cream/.test(n)) return ['icecream',dessert('icecream')];
  if(/tea|juice|wine|barrel/.test(n)) return ['cup',cup(/juice/.test(n))];
  if(/music|song|rhythm|groove|beats|sound|fables|playing|heartbeat/.test(n)) return ['music',music()];
  if(/diary|album|book|ticket/.test(n)) return ['book',book()];
  if(/rocket|future/.test(n)) return ['rocket',rocket()];
  if(/lamp|light|camping/.test(n)) return ['lamp',/magic-lamp/.test(n)?lamp():lampLight()];
  if(/sword|scepter|warrior/.test(n)) return ['sword',sword()];
  if(/planet|star|ocean|beach|sky|cloud|night|morgana/.test(n)) return ['planet',planet()];
  if(/mask|morocco|demon/.test(n)) return ['mask',mask()];
  if(/boot/.test(n)) return ['shoe',shoe()];
  if(/sofa/.test(n)) return ['sofa',sofa()];
  if(/snowflake/.test(n)) return ['snowflake',snowflake()];
  if(/umbrella/.test(n)) return ['umbrella',umbrella()];
  if(/jar/.test(n)) return ['jar',jar()];
  if(/fire|bomb|landmine/.test(n)) return ['firework',firework()];
  if(/chandelier/.test(n)) return ['chandelier',chandelier()];
  if(/pocket/.test(n)) return ['purse',purse()];
  if(/like|hands/.test(n)) return ['thumbs',thumbs()];
  if(/heart|kiss|lips|couple|love|accompany|balance|charger/.test(n)) return ['heart',heart(120,123,1.16)];
  if(/carousel/.test(n)) return ['carousel',castle()+group(unicorn(),'translate(72 108) scale(.37)')];
  if(/dreamcatcher/.test(n)) return ['dreamcatcher',circle(120,99,49,'none',`stroke="${gold}" stroke-width="6"`)+Array.from({length:6},(_,i)=>group(path('M120 50L162 123L78 123Z','none',`stroke="${body}" stroke-width="2"`),`rotate(${i*30} 120 99)`)).join('')+[88,120,151].map((x,i)=>line(x,145,x,185+(i%2)*15,edge,2)+gem(x,188+(i%2)*15,10)).join('')];
  if(/carpet/.test(n))return ['carpet',path('M33 132L135 88L211 128L112 185Z',body,'stroke="#EDC68E" stroke-width="5"')+path('M60 134L134 104L181 130L111 169Z','none',`stroke="${gold}" stroke-width="3"`)+gem(123,137,16)+[0,1,2,3,4].map(i=>line(48+i*14,152+i*6,40+i*14,166+i*6,edge,3)).join('')];
  return ['box',box()];
}

const palettes = {
  rose: ['#FFF4F0','#EF7D9C','#B53164','#F7C5C9'],
  lavender: ['#F7EFFF','#B49AE8','#644F9A','#E3D2FA'],
  ocean: ['#EAFBFF','#79CEDB','#357BA3','#C3EDF0'],
  gold: ['#FFF0BA','#E8BB67','#AB7035','#FFE5A4'],
  mint: ['#EDFFED','#87CDB8','#3F8C83','#C4EBD6'],
};
function palette(g) {
  const n=g.id;
  if(/gold|royal|crown|grail|trophy|king|boot|bronze|lamp/.test(n)||g.category==='Privilege')return 'gold';
  if(/blue|ocean|snow|diamond|crystal|cloud|moon|wolf|ice|ship|boat/.test(n))return 'ocean';
  if(/green|garden|peacock|woodland/.test(n))return 'mint';
  if(/purple|magic|star|dream|fairy|unicorn|galaxy|neon|planet/.test(n)||g.customizable)return 'lavender';
  return 'rose';
}
const manifest={},meta={},finishes={};
for (const [index,g] of gifts.entries()) {
  const p=palette(g),[light,mid,dark,soft]=palettes[p];
  const [kind,illustration]=motif(g);
  const extra=/heart|romantic|love|pink|sweet/.test(g.id)&&!['heart','animal'].includes(kind)?heart(187,67,.22):g.category==='Privilege'?star(185,56,10):'';
  const ornament=index%3===0?star(48,74,5,'#EDD5AB')+circle(190,165,2.5,'#DEC3A0'):'';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 240 240">
  <defs>
    <linearGradient id="gold" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#FFF3C8"/><stop offset=".24" stop-color="#E3BC71"/><stop offset=".46" stop-color="#F5D68F"/><stop offset=".72" stop-color="#B27A37"/><stop offset="1" stop-color="#E7C17B"/></linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".28" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <linearGradient id="soft" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${soft}"/></linearGradient>
    <linearGradient id="petal" x1=".15" y1="0" x2=".8" y2="1"><stop stop-color="#FFE0E0"/><stop offset=".24" stop-color="#F299B0"/><stop offset=".68" stop-color="#CF527C"/><stop offset="1" stop-color="#96365C"/></linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#A1D0A9"/><stop offset="1" stop-color="#286D58"/></linearGradient>
    <linearGradient id="ivory" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFFCF3"/><stop offset=".6" stop-color="#F4E3D7"/><stop offset="1" stop-color="#C5A7BB"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#E5FBFF"/><stop offset=".36" stop-color="#AAD7E4"/><stop offset=".7" stop-color="#7799BA"/><stop offset="1" stop-color="#D7EDF5"/></linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#090611" flood-opacity=".26"/></filter>
  </defs>
  <g filter="url(#shadow)">${illustration}</g>${extra}${ornament}</svg>`;
  const stem = g.id;
  await writeChanged(new URL(stem+'.svg',destination),svg);
  await writeChanged(new URL(stem+'.png',destination),await sharp(Buffer.from(svg)).png({palette:true,quality:95}).toBuffer());
  manifest[g.id]=`require('./assets/gifts/${stem}.png')`;
  meta[g.id]={motif:kind,palette:p};
  if(g.customizable) {
    finishes[g.id]={};
    for(const [finish,target] of Object.entries({gold:'gold',pink:'rose',blue:'ocean',purple:'lavender'})) {
      const next=palettes[target];
      const replacements=new Map([[light,next[0]],[mid,next[1]],[dark,next[2]],[soft,next[3]]]);
      const colored=svg.replace(/#[0-9a-fA-F]{6}/g,value=>replacements.get(value)||value);
      const filename=`${stem}--${finish}.png`;
      await writeChanged(new URL(filename,destination),await sharp(Buffer.from(colored)).png({palette:true,quality:95}).toBuffer());
      finishes[g.id][finish]=`require('./assets/gifts/${filename}')`;
    }
  }
}
const imports=Object.entries(manifest).map(([id,value])=>`  '${id}': ${value},`).join('\n');
const finishImports=Object.entries(finishes).map(([id,values])=>`  '${id}': { ${Object.entries(values).map(([color,value])=>`${color}: ${value}`).join(', ')} },`).join('\n');
await writeChanged(new URL('../apps/mobile/giftAssets.ts',import.meta.url),`// Generated by scripts/build-gift-art.mjs. Local, offline-ready original illustrations.\nimport type { ImageSourcePropType } from 'react-native';\nexport const giftAssets: Record<string, ImageSourcePropType> = {\n${imports}\n};\nexport const giftFinishes: Record<string, Record<string, ImageSourcePropType>> = {\n${finishImports}\n};\n`);
await writeChanged(new URL('../apps/mobile/assets/gifts/art-direction.json',import.meta.url),JSON.stringify({version:1,style:'Illustrated keepsakes: satin colors, brushed gold, ivory highlights; no text or emoji glyphs.',gifts:meta},null,2));
console.log(`Created ${gifts.length} original SVG illustrations, PNGs and native asset manifest.`);
