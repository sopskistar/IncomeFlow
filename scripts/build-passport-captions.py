"""Create editable captions from the actual TTS sentence-boundary timings."""
import json
import pathlib
import textwrap
root=pathlib.Path(__file__).resolve().parents[1]
scenes=json.loads((root/'video/passport-narration.json').read_text())
provenance=json.loads((root/'video/public/passport-narration/provenance.json').read_text())
speeds={s['id']:s['speed'] for s in provenance['scenes']}
def stamp(t):
    n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
entries=[]
for scene in scenes:
    for line in (root/f"video/public/passport-narration/{scene['id']}.words.jsonl").read_text().splitlines():
        event=json.loads(line)
        if event['type']!='SentenceBoundary':continue
        start=scene['from']+event['offset']/1e7/speeds[scene['id']]
        duration=event['duration']/1e7/speeds[scene['id']]
        words=event['text'].split();chunks=[];chunk=[]
        for word in words:
            if chunk and len(' '.join(chunk+[word]))>86:chunks.append(' '.join(chunk));chunk=[]
            chunk.append(word)
        if chunk:chunks.append(' '.join(chunk))
        total=sum(len(c) for c in chunks)
        for c in chunks:
            end=min(start+duration*len(c)/total,scene['from']+scene['duration']-.04)
            assert end>start
            entries.append((start,end,'\n'.join(textwrap.wrap(c,44))))
            start=end
# Edge sentence-duration estimates overlap the following boundary by about50ms.
# Switch displayed text at the next actual boundary, keeping audio untouched.
for i in range(len(entries)-1):
    a,b,c=entries[i]
    if b>entries[i+1][0]:
        assert b-entries[i+1][0]<.08, 'Unexpected source-boundary overlap'
        entries[i]=(a,entries[i+1][0]-.01,c)
out=root/'artifacts/video/passport/incomeflow-passport.srt'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text('\n\n'.join(f'{i+1}\n{stamp(a)} --> {stamp(b)}\n{c}' for i,(a,b,c) in enumerate(entries))+'\n')
assert all(entries[i][1]<=entries[i+1][0]+.02 for i in range(len(entries)-1))
print(f'{len(entries)} captions written: {out}')
