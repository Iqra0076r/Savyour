import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownToLine, ArrowRight, Check, Clipboard, Link2, LoaderCircle, Moon, Play, ShieldCheck, Sparkles, Sun, X } from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const platforms = [
  ['YouTube','Videos & Shorts','▶','youtube'], ['TikTok','Public videos','♪','tiktok'],
  ['Instagram','Reels & posts','◎','instagram'], ['Facebook','Public videos','f','facebook'],
  ['X','Public posts','𝕏','x'], ['Vimeo','Permitted videos','v','vimeo'],
  ['Pinterest','Public video pins','p','pinterest']
];
const faqs = [
  ['Which sites can I use?', 'SaveFlow supports public videos from the listed platforms when the source permits access. Availability can change as platforms update their services.'],
  ['Why might a link fail?', 'Private posts, login walls, geographic restrictions, expired links, and platform changes can prevent analysis or downloading. Try a public individual video link.'],
  ['Which quality will I get?', 'Choose Best available to request the highest video and audio combination the source provides. Specific resolutions depend on that video.'],
  ['Can I save any video?', 'Save only media you own or have permission to download. Respect creators and the rules of the source platform.']
];
function App(){
  const [url,setUrl]=useState(''), [result,setResult]=useState(null), [selected,setSelected]=useState('best');
  const [working,setWorking]=useState(false), [downloading,setDownloading]=useState(false), [error,setError]=useState('');
  const [light,setLight]=useState(false), [open,setOpen]=useState(-1), [active,setActive]=useState('downloader');
  const timer=useRef(null), current=useRef(0), input=useRef(null);
  async function analyze(value){
    const v=value.trim(); if(!v) return;
    const seq=++current.current; setWorking(true); setResult(null); setError(''); setSelected('best');
    try{
      const response=await fetch(`${API}/api/analyze`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:v})});
      const data=await response.json(); if(seq!==current.current) return;
      if(!response.ok) throw Error(data.detail || 'Could not analyze this link.');
      setResult(data);
    }catch(e){if(seq===current.current) setError(e.message || 'Connection to download server failed.');}
    finally{if(seq===current.current) setWorking(false);}
  }
  function onChange(v){setUrl(v);setResult(null);setError('');clearTimeout(timer.current);++current.current;setWorking(false);
    if(/^https:\/\/\S+\.[^\s]+/.test(v.trim())) timer.current=setTimeout(()=>analyze(v),650);
  }
  async function paste(){try{onChange(await navigator.clipboard.readText());input.current?.focus();}catch{setError('Clipboard access unavailable. Paste the link into the field.');}}
  async function download(){if(!url || downloading) return; setDownloading(true);setError('');
    try{const response=await fetch(`${API}/api/download`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,format_id:selected})});
      if(!response.ok){const data=await response.json();throw Error(data.detail || 'Download failed.');}
      const blob=await response.blob(); const object=URL.createObjectURL(blob);const a=document.createElement('a');a.href=object;
      const disposition=response.headers.get('content-disposition')||'';const match=disposition.match(/filename\*=UTF-8''([^;]+)/i);
      a.download=match?decodeURIComponent(match[1]):'saveflow-video.mp4';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),60000);
    }catch(e){setError(e.message || 'Download failed.');}finally{setDownloading(false);}
  }
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const chosen=result?.formats.find(f=>f.id===selected);
  const formatLabel=f=>`${f.height?`${f.height}p`:'Video'} · ${(f.ext||'video').toUpperCase()}${f.has_audio?' · audio':''}${f.size?` · ${(f.size/1048576).toFixed(1)} MB`:''}`;
  return <div className={`app ${light?'light':''}`}>
    <div className="aurora aurora-a"/><div className="aurora aurora-b"/><div className="orb orb-a"/><div className="orb orb-b"/>
    <div className="site-shell">
      <header><a className="brand" href="#downloader" onClick={()=>setActive('downloader')}><span className="mark">S</span><span>SaveFlow</span></a>
        <nav aria-label="Primary navigation">{[['downloader','Downloader'],['sites','Supported Sites'],['how','How It Works'],['faq','FAQ']].map(([id,label])=><a className={active===id?'active':''} onClick={()=>setActive(id)} href={`#${id}`} key={id}>{label}</a>)}</nav>
        <button className="theme" title="Toggle theme" aria-label="Toggle theme" onClick={()=>setLight(!light)}>{light?<Sun size={18}/>:<Moon size={18}/>}</button>
      </header>
      <main>
        <section className="hero" id="downloader"><div className="eyebrow"><Sparkles size={14}/> YOUR MEDIA. YOUR FLOW.</div>
          <h1>Download Social<br/><span>Videos Easily.</span></h1>
          <p className="lead">Paste a public video link and save media you own or have permission to download.</p>
          <form onSubmit={e=>{e.preventDefault();clearTimeout(timer.current);analyze(url)}} className="link-form">
            <Link2 size={21}/><input ref={input} type="url" value={url} onChange={e=>onChange(e.target.value)} placeholder="Paste video URL here..." aria-label="Video URL" required/>
            {url&&<button type="button" className="icon-clear" onClick={()=>onChange('')} aria-label="Clear link"><X size={18}/></button>}
            <span className="detect">{working?<><LoaderCircle size={16} className="spin"/> Analyzing</>:result?<><Check size={16}/> Ready</>:'PASTE A LINK'}</span>
          </form>
          <div className="hero-actions"><button className="button ghost" onClick={paste}><Clipboard size={18}/> Paste Link</button><button className="button primary" onClick={()=>result?download():analyze(url)} disabled={!url||working||downloading}>{working||downloading?<LoaderCircle size={18} className="spin"/>:<ArrowDownToLine size={18}/>} {result?(downloading?'Preparing file...':'Download Best Quality'):(working?'Analyzing...':'Analyze Link')}</button></div>
          {error&&<div role="alert" className="error">{error}</div>}
          {result&&<div className="result"><div className="preview">{result.thumbnail?<img src={result.thumbnail} alt="Video thumbnail" referrerPolicy="no-referrer"/>:<div className="no-image"><Play size={36}/></div>}<span className="play"><Play fill="currentColor" size={21}/></span></div><div className="result-info"><span className="pill ready"><Check size={14}/> VIDEO READY</span><h2>{result.title}</h2><p>{result.creator||'Public video'} · {result.platform||'Supported platform'}</p><label htmlFor="quality">Choose quality</label><select id="quality" value={selected} onChange={e=>setSelected(e.target.value)}><option value="best">Best available video + audio</option>{result.formats.map(f=><option key={f.id} value={f.id}>{formatLabel(f)}</option>)}</select><button className="button primary full" onClick={download} disabled={downloading}>{downloading?<LoaderCircle className="spin" size={18}/>:<ArrowDownToLine size={18}/>} {downloading?'Preparing download...':`Download ${chosen?.height?`${chosen.height}p`:'video'}`}</button><small>Best quality may require a few moments to combine video and audio.</small></div></div>}
          {!result&&<div className="platform-pills">{platforms.map(([name,,symbol,cls])=><span key={name}><b className={`mini ${cls}`}>{symbol}</b>{name}</span>)}</div>}
          <div className="trust"><span><Sparkles size={16}/> Easy to use</span><i/> <span><ShieldCheck size={16}/> Privacy focused</span><i/> <span>∞ &nbsp; No software</span></div>
        </section>
        <section className="section sites" id="sites"><div className="section-top"><span className="eyebrow">ONE LINK. YOUR FAVORITE PLATFORMS.</span><h2>Made for the places<br/><em>you create.</em></h2><p>Explore the public video sources SaveFlow can analyze.</p></div><div className="platform-grid">{platforms.map(([name,description,symbol,cls])=><button key={name} className={`platform-card ${cls}`} onClick={()=>{setActive('downloader');document.getElementById('downloader').scrollIntoView({behavior:'smooth'});input.current?.focus()}}><span className="platform-icon">{symbol}</span><span className="platform-copy"><strong>{name}</strong><small>{description}</small><span className="supported"><Check size={14}/> Public links</span></span><ArrowRight className="card-arrow" size={19}/></button>)}</div></section>
        <section className="section how" id="how"><div className="section-top"><span className="eyebrow">EFFORTLESS BY DESIGN</span><h2>Three steps. <em>One flow.</em></h2></div><div className="steps">{[['01','Paste your link','Copy a public video URL from a supported site and paste it above.'],['02','See the preview','SaveFlow checks the link and shows the thumbnail and available formats.'],['03','Choose and save','Pick a format or request the best available video and audio.']].map(([n,t,d])=><div className="step" key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></div>)}</div></section>
        <section className="section faq" id="faq"><div className="section-top"><span className="eyebrow">GOOD TO KNOW</span><h2>Frequently asked <em>questions.</em></h2></div><div className="faq-list">{faqs.map(([q,a],i)=><div className="faq-item" key={q}><button aria-expanded={open===i} onClick={()=>setOpen(open===i?-1:i)}>{q}<span>{open===i?'−':'+'}</span></button>{open===i&&<p>{a}</p>}</div>)}</div></section>
      </main><footer><a className="brand" href="#downloader"><span className="mark">S</span><span>SaveFlow</span></a><p>Your media. Your flow. © {new Date().getFullYear()} SaveFlow</p><small>Only download content you own or are authorized to save.</small></footer>
    </div></div>
}
createRoot(document.getElementById('root')).render(<App/>);
