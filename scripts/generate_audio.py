"""Original procedural sound designs. Python stdlib only; deterministic PCM WAV."""
import math, random, wave, struct, pathlib
R=22050
ROOT=pathlib.Path(__file__).resolve().parents[1]
rng=random.Random(42)
D={'wolf':4.2,'rooster':2.5,'owl':2.4,'night':12,'wind':10,'bells':4.5,'thunder':4,'witch':2.8,'seer':3,'cupid':1.2,'hunter':1.5,'girl':2.5,'thief':1.8,'shield':2,'flute':3.8,'crow':2.2,'clap':3,'boo':2.5,'death':3.5,'knell':5,'heart':4,'drum':3,'clock':4,'gavel':1,'village':4,'wolves':4,'fail':3,'scream':1.8,'scratch':1,'evil':3,'goat':2,'crickets':3}
def osc(f,t):return math.sin(2*math.pi*f*t)
def hit(t,p,decay=8):return math.exp(-(t-p)*decay) if t>=p else 0
def bell(t,p,f):
 a=t-p
 return 0 if a<0 else sum(osc(f*m,a)*math.exp(-a*(.8+i*.6))/(i+1) for i,m in enumerate([1,2.01,2.76,4.07]))
def render(k,t,d,n,low):
 env=min(1,t/.025,(d-t)/.08)
 if k=='wolf':
  f=300+120*math.sin(math.pi*t/d)+8*math.sin(t*6);return env*math.sin(math.pi*t/d)**.6*(osc(f,t)+.23*osc(2*f,t)+.08*n)
 if k=='rooster':
  gate=max(0,math.sin(t*8)) if t<1.4 else math.exp(-(t-1.4)*2);f=640+120*math.sin(t*7);return env*gate*(osc(f,t)+.3*osc(f*2,t))
 if k=='owl': return env*max(0,math.sin(t*5))**3*(osc(380,t)+.2*osc(760,t))
 if k in ['night','crickets']:
  chirp=max(0,math.sin(2*math.pi*2*t))**8;return env*(.22*chirp*osc(3800,t)+.15*max(0,math.sin(t*1.7))**12*osc(2900,t)+.18*low)
 if k=='wind':return env*(low*3*(.5+.3*math.sin(2*math.pi*t/d))+.08*osc(73,t))
 if k in ['bells','knell']:return env*sum(bell(t,p,440 if k=='bells' else 160) for p in ([0,.8,1.6] if k=='bells' else [0,2]))*.5
 if k=='thunder':return env*(low*6+n*.15)*math.exp(-t*.8)*(.7+.3*math.sin(t*13))
 if k=='witch':return env*(.5*osc(280+120*math.sin(t*16),t)*max(0,math.sin(t*22))+.3*low)
 if k in ['seer','shield']:return env*math.sin(math.pi*t/d)*sum(osc(f,t) for f in ([440,554.37,659.25,880] if k=='seer' else [220,330,440]))/3
 if k=='cupid':return env*(n*.5*math.exp(-t*9)+osc(1200-600*t,t)*math.exp(-t*6))
 if k=='hunter':return env*(n*math.exp(-t*14)+low*3*math.exp(-t*4))
 if k in ['girl','evil']:return env*max(0,math.sin(t*13))**2*(osc((650 if k=='girl' else 160)+40*math.sin(t*4),t)+.3*osc(320,t))
 if k=='thief':return env*sum(bell(t,p,f)*.25 for p,f in [(0,1800),(.18,2400),(.4,2100),(.7,2900)])
 if k=='flute':
  notes=[523.25,622.25,698.46,783.99,698.46,622.25,523.25,466.16];i=min(7,int(t/.475));return env*math.sin(math.pi*(t%.475)/.475)*(.8*osc(notes[i],t)+.08*n)
 if k=='crow':return env*max(0,math.sin(t*7))**3*(osc(520+30*math.sin(t*50),t)+.5*n)
 if k=='clap':return env*n*sum(hit(t,p,45)*.7 for p in [i*.13+rng.random()*.04 for i in range(22)])
 if k=='boo':return env*math.sin(math.pi*t/d)*sum(osc(f+5*math.sin(t*4),t) for f in [160,174,207,241])/4
 if k=='death':return env*math.exp(-t*.7)*(osc(100-9*t,t)+.3*osc(149-12*t,t)+.3*low)
 if k=='heart':return env*sum(hit(t,p,35)*osc(55,t) for i in range(5) for p in [i*.85,i*.85+.18])
 if k=='drum':return env*(n*.35+osc(110,t))*(.3+t/d*.7)*hit(t,int(t/(.12-.06*t/d))*(.12-.06*t/d),40)
 if k=='clock':return env*sum(hit(t,p,90)*osc(1800 if i%2 else 1300,t) for i,p in enumerate([j*.5 for j in range(8)]))
 if k=='gavel':return env*(osc(160,t)+n*.5)*math.exp(-t*16)
 if k in ['village','wolves']:
  notes=[261.63,329.63,392,523.25] if k=='village' else [146.83,174.61,207.65,293.66];return env*sum(osc(f,t)*min(1,max(0,(t-i*.35)*4)) for i,f in enumerate(notes))/4*math.sin(math.pi*t/d)**.4
 if k=='fail':
  f=[311.13,293.66,277.18,207.65][min(3,int(t/.7))];return env*(osc(f+3*math.sin(t*25),t)+.3*osc(f*2,t))*.65
 if k=='scream':return env*math.sin(math.pi*t/d)*(.7*osc(740+130*math.sin(t*3)+25*math.sin(t*35),t)+.15*n)
 if k=='scratch':return env*(n*.5+osc(500+350*math.sin(t*16),t))*math.exp(-t*2)
 if k=='goat':return env*max(0,math.sin(t*3))*(osc(380+65*math.sin(t*38),t)+.3*osc(760,t))
 return 0
for k,d in D.items():
 low=0; data=[]
 for i in range(int(R*d)):
  t=i/R;n=rng.uniform(-1,1);low=.97*low+.03*n
  data.append(render(k,t,d,n,low))
 peak=max(abs(v) for v in data) or 1
 with wave.open(str(ROOT/'assets/audio'/f'{k}.wav'),'wb') as w:
  w.setparams((1,2,R,0,'NONE','not compressed'));w.writeframes(struct.pack('<%dh'%len(data),*(int(v/peak*.78*32767) for v in data)))
 print(k, len(data)*2)
