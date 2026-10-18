"""Offline inventory only. Never execute the supplied APK or contact its endpoints."""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import json
import re
import struct
import tempfile
from collections import Counter

SOURCE = Path(r'C:\Users\maury\Downloads\com.live.party_5.54.0.xapk')
OUT = Path(__file__).parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def dex_strings(data):
    if not data.startswith(b'dex\n'):
        return []
    size, offset = struct.unpack_from('<II', data, 56)
    values = []
    for n in range(size):
        pos = struct.unpack_from('<I', data, offset + n * 4)[0]
        while data[pos] & 128:
            pos += 1
        pos += 1
        end = data.index(b'\0', pos)
        values.append(data[pos:end].decode('utf-8', errors='replace'))
    return values

with ZipFile(SOURCE) as package:
    metadata = json.loads(package.read('manifest.json'))
    raw = package.read('com.live.party.apk')
    native_raw = package.read('config.arm64_v8a.apk')

apk_path = Path(tempfile.gettempdir()) / 'melo-party-analysis' / 'com.live.party.apk'
apk_path.parent.mkdir(exist_ok=True)
apk_path.write_bytes(raw)
with ZipFile(apk_path) as apk, ZipFile(__import__('io').BytesIO(native_raw)) as native:
    members = [{'path': i.filename, 'size': i.file_size} for i in apk.infolist()]
    native_libs = [i.filename for i in native.infolist() if i.filename.endswith('.so')]
    dex_names = [i.filename for i in apk.infolist() if re.fullmatch(r'classes\d*\.dex', i.filename)]
    strings = set()
    for name in dex_names:
        strings.update(dex_strings(apk.read(name)))
    descriptors = sorted(v for v in strings if v.startswith('L') and v.endswith(';') and '/' in v and ' ' not in v)
    namespaces = Counter('/'.join(v.split('/')[:3]) for v in descriptors)
    classes = [v for v in descriptors if v.startswith(('Lcom/yy/', 'Lcom/duowan/', 'Lcom/live/', 'Lsg/bigo/', 'Lcom/ola/'))]
    # Only retain class descriptors as feature candidates, not arbitrary strings/credentials.
    terms = ['room', 'gift', 'wallet', 'recharge', 'family', 'game', 'rank', 'vip', 'chat', 'live', 'login', 'feed', 'moment', 'club', 'task', 'event', 'pk', 'music', 'seat', 'mic', 'report']
    candidates = {term: [v for v in classes if term in v.lower()][:40] for term in terms}
    sdk_terms = ['agora', 'zego', 'tencent/trtc', 'livekit', 'firebase', 'facebook', 'flutter', 'reactnative', 'volcengine', 'rongcloud']
    sdk = {term: sum(1 for v in strings if v.startswith('L') and v.endswith(';') and term in v.lower()) for term in sdk_terms}

report = {
    'source': str(SOURCE), 'source_sha256': digest(SOURCE.read_bytes()),
    'apk_sha256': digest(raw), 'native_split_sha256': digest(native_raw),
    'method': 'Python zipfile + DEX string-table parsing; no app execution, no network requests. Class names are candidates only.',
    'identity': {k: metadata.get(k) for k in ['name','package_name','version_name','version_code','min_sdk_version','target_sdk_version']},
    'dex_files': dex_names, 'archive_entry_count': len(members),
    'native_libraries': native_libs, 'application_class_count': len(classes),
    'top_class_namespaces': namespaces.most_common(40),
    'class_name_candidates': candidates, 'sdk_descriptor_counts': sdk,
    'limitations': ['No runtime screen or account access.', 'Class and SDK names do not establish enabled features.', 'No backend source or server rules recovered.', 'No JADX decompilation has been performed.'],
}
(OUT / 'artifact-inventory.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
(OUT / 'archive-members.json').write_text(json.dumps(members, indent=2), encoding='utf-8')
print(json.dumps({k: report[k] for k in ['identity','dex_files','archive_entry_count','application_class_count','native_libraries','sdk_descriptor_counts']}, indent=2))
print('APK for REA inspection:', apk_path)
