"""Transcribes podcast episodes that have no transcript yet.
Reads data/episodes.json, writes data/transcripts/podcast/<slug>.txt.
Runs in the GitHub Action (CPU, faster-whisper). At most MAX episodes per run."""
import json, os, sys, tempfile, urllib.request
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'transcripts', 'podcast')
MAX = int(os.environ.get('MAX_TRANSCRIBE', '8'))
os.makedirs(OUT, exist_ok=True)

episodes = json.load(open(os.path.join(ROOT, 'data', 'episodes.json')))
todo = [e for e in episodes if e.get('audio') and not os.path.exists(os.path.join(OUT, e['slug'] + '.txt'))][:MAX]
if not todo:
    print('Transcripts: nothing new'); sys.exit(0)

model = WhisperModel('small.en', device='cpu', compute_type='int8')
for e in todo:
    with tempfile.NamedTemporaryFile(suffix='.m4a') as f:
        req = urllib.request.Request(e['audio'], headers={'User-Agent': 'therealflow.tv transcriber'})
        f.write(urllib.request.urlopen(req, timeout=120).read()); f.flush()
        segments, _ = model.transcribe(f.name, beam_size=1, vad_filter=True)
        text = '\n'.join(s.text.strip() for s in segments)
    open(os.path.join(OUT, e['slug'] + '.txt'), 'w').write(text + '\n')
    print(f"Transcribed: {e['title']} ({len(text.split())} words)")
