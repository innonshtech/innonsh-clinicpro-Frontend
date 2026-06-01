'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

export default function LandingPage() {
  const router = useRouter();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
    
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll('.mc, .pc, .dc');
    const onMouseMove = (e, card) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-5px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
    };
    const onMouseLeave = (card) => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s, border-color 0.3s';
    };
    const onMouseEnter = (card) => {
      card.style.transition = 'transform 0.1s, box-shadow 0.3s, border-color 0.3s';
    };

    if (window.matchMedia('(hover:hover)').matches) {
      cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => onMouseMove(e, card));
        card.addEventListener('mouseleave', () => onMouseLeave(card));
        card.addEventListener('mouseenter', () => onMouseEnter(card));
      });
    }
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const t = document.querySelector(targetId);
    if (t) {
      t.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigateToLogin = (e) => {
    e.preventDefault();
    router.push('/login');
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    router.push('/login');
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-book-demo');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = 'Booking…';
    btn.disabled = true;
    btn.style.background = 'rgba(255,255,255,0.2)';
    setTimeout(() => {
      btn.innerHTML = '✓ Demo booked! We\'ll reach out within 24 hrs.';
      btn.style.background = '#16C26F';
      btn.style.boxShadow = '0 4px 20px rgba(22,194,111,0.45)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.disabled = false;
        btn.style.background = '';
        btn.style.boxShadow = '';
        e.target.reset();
      }, 3500);
    }, 1400);
  };

  return (
    <div className="landing-wrapper">
      <Head>
        <title>Innonsh ClinicPro — Next-Generation Healthcare Platform</title>
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `

/* ─────────────────────────────────────────────────────────────
   RESET
───────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #F8FAFF;
  color: #0F1117;
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
.landing-wrapper {
  --blue:         #1170EF;
  --blue-dark:    #0A5BD4;
  --blue-50:      #EEF5FF;
  --blue-100:     #DAEAFF;
  --blue-glow:    rgba(17,112,239,0.22);
  --teal:         #0FBFBD;
  --teal-50:      rgba(15,191,189,0.10);
  --purple:       #6C3EEB;
  --purple-50:    rgba(108,62,235,0.10);
  --green:        #16C26F;
  --green-50:     rgba(22,194,111,0.10);
  --amber:        #F59E0B;
  --amber-50:     rgba(245,158,11,0.10);
  --ink:          #0F1117;
  --ink-80:       #1E2333;
  --ink-60:       #4B526B;
  --ink-40:       #8890A8;
  --line:         #E4E8F2;
  --surface:      #F8FAFF;
  --surface-2:    #F1F5FC;
  --white:        #FFFFFF;
  --r-xs:   6px;  --r-sm: 10px; --r-md: 14px;
  --r-lg:   18px; --r-xl: 24px; --r-full: 9999px;
  --s-xs:  0 1px 2px rgba(15,17,23,0.06);
  --s-sm:  0 2px 8px rgba(15,17,23,0.07), 0 1px 3px rgba(15,17,23,0.04);
  --s-md:  0 4px 20px rgba(15,17,23,0.08), 0 2px 8px rgba(15,17,23,0.04);
  --s-lg:  0 8px 40px rgba(15,17,23,0.10), 0 4px 16px rgba(15,17,23,0.05);
  --s-xl:  0 20px 60px rgba(15,17,23,0.12), 0 8px 24px rgba(15,17,23,0.06);
  --s-blue: 0 4px 20px rgba(17,112,239,0.28), 0 1px 4px rgba(17,112,239,0.18);
  --s-blue-lg: 0 8px 32px rgba(17,112,239,0.36), 0 2px 8px rgba(17,112,239,0.20);
  --ease: cubic-bezier(0.22,1,0.36,1);
  --ease-out: cubic-bezier(0.16,1,0.3,1);
}

/* ─────────────────────────────────────────────────────────────
   TYPOGRAPHY
───────────────────────────────────────────────────────────── */
h1 { font-size: clamp(2.4rem,4.5vw,3.75rem); font-weight: 800; line-height: 1.10; letter-spacing: -0.035em; color: var(--ink); }
h2 { font-size: clamp(1.75rem,3vw,2.5rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.025em; color: var(--ink); }
h3 { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
h4 { font-size: 0.9rem; font-weight: 600; color: var(--ink); }
p  { color: var(--ink-60); line-height: 1.65; }

/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.72s var(--ease-out), transform 0.72s var(--ease-out);
}
.reveal.in { opacity: 1; transform: translateY(0); }
.d1 { transition-delay: 0.08s; }
.d2 { transition-delay: 0.16s; }
.d3 { transition-delay: 0.24s; }
.d4 { transition-delay: 0.32s; }
.d5 { transition-delay: 0.40s; }
.d6 { transition-delay: 0.48s; }
.d7 { transition-delay: 0.56s; }
.d8 { transition-delay: 0.64s; }
.d9 { transition-delay: 0.72s; }

/* ─────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────── */
.wrap  { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
.sec   { padding: 96px 0; }
.sec-l { padding: 112px 0; }

.eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 13px; border-radius: var(--r-full);
  background: var(--blue-50); color: var(--blue);
  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.10em;
  text-transform: uppercase; border: 1px solid var(--blue-100);
}
.eyebrow::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--blue); }
.eyebrow-dark {
  background: rgba(108,62,235,0.14); color: #A78BFA;
  border-color: rgba(108,62,235,0.22);
}
.eyebrow-dark::before { background: #A78BFA; }

.sec-hd { text-align: center; margin-bottom: 64px; }
.sec-hd h2 { margin: 14px 0 12px; }
.sec-hd p  { max-width: 560px; margin: 0 auto; font-size: 1.05rem; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 26px; border-radius: var(--r-sm);
  font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; border: none; text-decoration: none;
  transition: all 0.22s var(--ease); white-space: nowrap;
}
.btn-lg { padding: 15px 32px; font-size: 0.95rem; border-radius: var(--r-md); }
.btn-p  { background: var(--blue); color: #fff; box-shadow: var(--s-blue); }
.btn-p:hover { background: var(--blue-dark); box-shadow: var(--s-blue-lg); transform: translateY(-2px); }
.btn-s  { background: var(--white); color: var(--ink-80); border: 1.5px solid var(--line); box-shadow: var(--s-xs); }
.btn-s:hover { border-color: var(--blue); color: var(--blue); box-shadow: var(--s-sm); transform: translateY(-2px); }
.btn-g  { background: rgba(255,255,255,0.07); color: #fff; border: 1.5px solid rgba(255,255,255,0.18); backdrop-filter: blur(8px); }
.btn-g:hover { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.35); transform: translateY(-2px); }

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
.nav {
  position: sticky; top: 0; z-index: 200;
  background: rgba(248,250,255,0.88);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(228,232,242,0.7);
  transition: box-shadow 0.3s;
}
.nav.scrolled { box-shadow: 0 2px 20px rgba(15,17,23,0.07); }
.nav-row { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.nav-logo {
  display: flex; align-items: center; gap: 9px;
  text-decoration: none; font-weight: 800; font-size: 1.05rem;
  color: var(--ink); letter-spacing: -0.02em;
}
.nav-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: linear-gradient(135deg, #1170EF, #0A5BD4);
  display: grid; place-items: center; color: #fff;
  font-size: 0.95rem; font-weight: 800;
  box-shadow: 0 3px 10px rgba(17,112,239,0.35);
  transition: transform 0.2s var(--ease), box-shadow 0.2s;
}
.nav-logo:hover .nav-icon { transform: scale(1.07); box-shadow: 0 6px 16px rgba(17,112,239,0.4); }
.nav-menu { display: flex; align-items: center; gap: 4px; list-style: none; }
.nav-menu a {
  padding: 6px 12px; border-radius: var(--r-xs);
  text-decoration: none; color: var(--ink-60);
  font-size: 0.875rem; font-weight: 500;
  transition: color 0.15s, background 0.15s;
}
.nav-menu a:hover { color: var(--ink); background: rgba(15,17,23,0.05); }
.nav-end { display: flex; align-items: center; gap: 8px; }
.btn-signin {
  padding: 9px 20px; border-radius: var(--r-full);
  font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 500;
  color: var(--ink-80); background: var(--white);
  border: 1.5px solid var(--line); cursor: pointer; text-decoration: none;
  transition: all 0.2s var(--ease); white-space: nowrap;
  box-shadow: var(--s-xs);
}
.btn-signin:hover { border-color: var(--blue); color: var(--blue); transform: translateY(-1px); box-shadow: var(--s-sm); }
.btn-reqdemo {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: var(--r-full);
  font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 600;
  color: #fff; background: linear-gradient(135deg, #3B5BDB, #6C3EEB);
  border: none; cursor: pointer; text-decoration: none;
  box-shadow: 0 4px 16px rgba(108,62,235,0.35); transition: all 0.22s var(--ease); white-space: nowrap;
}
.btn-reqdem o:hover { background: linear-gradient(135deg, #2F4EC4, #5B32D4); box-shadow: 0 6px 22px rgba(108,62,235,0.45); transform: translateY(-2px); }
.btn-reqdem-arrow {
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(255,255,255,0.22); display: grid; place-items: center; flex-shrink: 0;
  font-size: 0.7rem; line-height: 1;
}
.burger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 6px; border: none; background: none; }
.burger span { width: 20px; height: 1.8px; background: var(--ink-60); border-radius: 2px; transition: all 0.3s var(--ease); display: block; }

/* ─────────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────────── */
.hero {
  padding: 96px 0 88px;
  background: linear-gradient(160deg, #EDF5FF 0%, #F8FAFF 45%, #EBF9F8 100%);
  position: relative; overflow: hidden;
}
.hero-orb {
  position: absolute; border-radius: 50%; pointer-events: none;
}
.orb-1 { width:700px; height:700px; background: radial-gradient(circle, rgba(17,112,239,0.06) 0%, transparent 65%); top:-220px; right:-150px; }
.orb-2 { width:480px; height:480px; background: radial-gradient(circle, rgba(15,191,189,0.08) 0%, transparent 65%); bottom:-160px; left:-80px; }
.orb-3 { width:280px; height:280px; background: radial-gradient(circle, rgba(108,62,235,0.05) 0%, transparent 65%); top:80px; left:35%; }
.hero::before {
  content: ''; position: absolute; inset: 0;
  background-image: linear-gradient(rgba(17,112,239,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(17,112,239,0.025) 1px, transparent 1px);
  background-size: 40px 40px; pointer-events: none;
}
.hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; position: relative; z-index: 1; }

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: var(--r-full);
  background: rgba(17,112,239,0.07); color: var(--blue);
  border: 1px solid rgba(17,112,239,0.15);
  font-size: 0.73rem; font-weight: 600; letter-spacing: 0.05em;
  margin-bottom: 24px;
  animation: fadeUp 0.6s var(--ease-out) both;
}
.badge-dot { width:7px; height:7px; border-radius:50%; background:var(--blue); animation: blink 2.2s ease-in-out infinite; }
@keyframes blink { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.8); } }

.hero h1 { margin-bottom: 20px; animation: fadeUp 0.65s 0.08s var(--ease-out) both; }
.accent-word { color: var(--blue); position: relative; }
.accent-word::after {
  content: ''; position: absolute; bottom: 1px; left: 0; right: 0;
  height: 3px; background: linear-gradient(90deg, var(--blue), var(--teal));
  border-radius: 2px; transform: scaleX(0); transform-origin: left;
  animation: slideIn 0.5s 0.75s var(--ease) forwards;
}
@keyframes slideIn { to { transform: scaleX(1); } }

.hero-sub { font-size: 1.08rem; line-height: 1.72; max-width: 500px; margin-bottom: 36px; animation: fadeUp 0.65s 0.15s var(--ease-out) both; }
.hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; animation: fadeUp 0.65s 0.22s var(--ease-out) both; }
.hero-trust { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; animation: fadeUp 0.65s 0.30s var(--ease-out) both; }
.t-chip { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 500; color: var(--ink-60); }
.t-check { width:16px; height:16px; border-radius:50%; background:var(--green-50); display:grid; place-items:center; flex-shrink:0; }
.t-check svg { width:9px; height:9px; stroke:var(--green); stroke-width:2.5; fill:none; }

@keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

/* Mockup */
.mockup {
  background: var(--white); border-radius: var(--r-xl);
  box-shadow: var(--s-xl); border: 1px solid var(--line); overflow: hidden;
  animation: fadeUp 0.75s 0.25s var(--ease-out) both;
  transition: transform 0.45s var(--ease), box-shadow 0.45s var(--ease);
}
.mockup:hover { transform: translateY(-6px) rotate(-0.4deg); box-shadow: 0 32px 80px rgba(15,17,23,0.14), 0 12px 30px rgba(15,17,23,0.07); }
.mk-bar { background: var(--surface-2); padding: 11px 18px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--line); }
.mk-dots { display: flex; gap: 5px; }
.mk-dots span { width:11px; height:11px; border-radius:50%; }
.mk-dots span:nth-child(1) { background:#FF6058; }
.mk-dots span:nth-child(2) { background:#FEBC2E; }
.mk-dots span:nth-child(3) { background:#28C840; }
.mk-url { flex:1; background:var(--line); border-radius:4px; height:20px; margin:0 10px; display:flex; align-items:center; padding:0 8px; font-size:0.6rem; color:var(--ink-40); font-weight:500; }
.mk-body { padding: 18px; }
.mk-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 14px; }
.mk-stat { background: var(--surface); border-radius: var(--r-xs); padding: 10px; border-left: 2.5px solid transparent; transition: transform 0.2s, box-shadow 0.2s; }
.mk-stat:hover { transform: translateY(-2px); box-shadow: var(--s-sm); }
.mk-stat.b { border-color: var(--blue); }
.mk-stat.t { border-color: var(--teal); }
.mk-stat.g { border-color: var(--green); }
.mk-stat.p { border-color: var(--purple); }
.mk-val { font-size: 1.2rem; font-weight: 800; color: var(--ink); letter-spacing: -0.02em; }
.mk-lbl { font-size: 0.58rem; font-weight: 500; color: var(--ink-40); margin-top: 2px; }
.mk-qlabel { font-size: 0.68rem; font-weight: 650; color: var(--ink); margin-bottom: 7px; display: flex; align-items: center; gap: 5px; }
.live-dot { width:5px; height:5px; border-radius:50%; background:#F04438; animation: blink 1.5s infinite; }
.mk-qrow { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 7px; margin-bottom: 3px; transition: background 0.15s; }
.mk-qrow:nth-child(odd) { background: var(--surface); }
.mk-qrow:hover { background: var(--surface-2); }
.mk-av { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; font-size:0.55rem; font-weight:700; color:#fff; flex-shrink:0; }
.mk-name { font-size: 0.7rem; font-weight: 600; color: var(--ink); flex: 1; }
.mk-st { font-size: 0.58rem; font-weight: 650; padding: 2px 7px; border-radius: var(--r-full); }
.st-a { background: rgba(22,194,111,0.12); color: var(--green); }
.st-n { background: rgba(245,158,11,0.12); color: var(--amber); }
.st-w { background: var(--blue-50); color: var(--blue); }
.mk-ai { margin-top:11px; padding:9px 12px; background: linear-gradient(135deg, rgba(108,62,235,0.07), rgba(17,112,239,0.05)); border:1px solid rgba(108,62,235,0.12); border-radius: var(--r-xs); display:flex; align-items:center; gap:8px; }
.mk-ai p { font-size:0.67rem; font-weight:500; color:var(--ink-60); }
.mk-ai strong { color: var(--purple); font-weight: 650; }

/* ─────────────────────────────────────────────────────────────
   PROOF BAR
───────────────────────────────────────────────────────────── */
.proof { background: var(--white); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 20px 0; }
.proof-row { display: flex; align-items: center; gap: 36px; flex-wrap: wrap; justify-content: center; }
.proof-lbl { font-size: 0.72rem; font-weight: 600; color: var(--ink-40); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
.proof-sep { width:1px; height:16px; background:var(--line); }
.proof-logos { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.proof-logo { font-size: 0.78rem; font-weight: 700; color: var(--ink-40); letter-spacing: -0.01em; transition: color 0.2s; }
.proof-logo:hover { color: var(--ink-60); }

/* ─────────────────────────────────────────────────────────────
   OVERVIEW
───────────────────────────────────────────────────────────── */
.overview { background: var(--white); }
.overview-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.pc {
  padding: 36px 28px; border-radius: var(--r-lg); border: 1px solid var(--line);
  position: relative; overflow: hidden;
  transition: transform 0.3s var(--ease), box-shadow 0.3s, border-color 0.3s;
}
.pc::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius: var(--r-lg) var(--r-lg) 0 0; transition: height 0.3s var(--ease); }
.pc:hover::before { height: 5px; }
.pc:hover { transform: translateY(-6px); box-shadow: var(--s-lg); border-color: transparent; }
.pc-blue::before   { background: linear-gradient(90deg, var(--blue), #5BADFF); }
.pc-teal::before   { background: linear-gradient(90deg, var(--teal), #6EE7E7); }
.pc-purple::before { background: linear-gradient(90deg, var(--purple), #A78BFA); }
.pc-icon { width:50px; height:50px; border-radius:var(--r-sm); display:grid; place-items:center; font-size:1.35rem; margin-bottom:20px; transition: transform 0.3s var(--ease); }
.pc:hover .pc-icon { transform: scale(1.08) rotate(-3deg); }
.pc-icon-b { background: var(--blue-50); }
.pc-icon-t { background: var(--teal-50); }
.pc-icon-p { background: var(--purple-50); }
.pc h3 { margin-bottom: 10px; font-size: 1.1rem; }
.pc p  { font-size: 0.875rem; line-height: 1.65; }

/* ─────────────────────────────────────────────────────────────
   AI SECTION
───────────────────────────────────────────────────────────── */
.ai-sec { background: #0C0F1D; position: relative; overflow: hidden; }
.ai-sec::before { content:''; position:absolute; width:700px; height:500px; border-radius:50%; background: radial-gradient(circle, rgba(108,62,235,0.15) 0%, transparent 65%); right:-120px; top:-120px; pointer-events:none; }
.ai-sec::after  { content:''; position:absolute; width:450px; height:450px; border-radius:50%; background: radial-gradient(circle, rgba(15,191,189,0.09) 0%, transparent 65%); left:-80px; bottom:-100px; pointer-events:none; }
.ai-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; position: relative; z-index: 1; }
.ai-sec h2 { color: #F0F2FF; margin: 14px 0; }
.ai-lead { color: #7A82A0; font-size: 1.05rem; margin-bottom: 36px; max-width: 440px; line-height: 1.72; }
.ai-rows { display: flex; flex-direction: column; gap: 12px; }
.ai-row {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px 18px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07); border-radius: var(--r-md);
  transition: background 0.25s, border-color 0.25s, transform 0.25s var(--ease);
}
.ai-row:hover { background: rgba(255,255,255,0.08); border-color: rgba(108,62,235,0.35); transform: translateX(4px); }
.ai-ico { width:42px; height:42px; flex-shrink:0; background: rgba(255,255,255,0.07); border-radius:var(--r-sm); display:grid; place-items:center; font-size:1.15rem; transition: transform 0.25s var(--ease); }
.ai-row:hover .ai-ico { transform: scale(1.1); }
.ai-row h4 { color: #E0E4F5; margin-bottom: 3px; }
.ai-row p  { font-size: 0.8rem; color: #7A82A0; line-height: 1.55; }

/* AI card */
.ai-card { background: #13172B; border-radius: var(--r-xl); border: 1px solid rgba(255,255,255,0.07); box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(108,62,235,0.12); overflow: hidden; transition: transform 0.4s var(--ease); }
.ai-card:hover { transform: translateY(-4px); }
.ai-chd { background: #1A1F38; padding: 13px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); }
.ai-chd-l { display: flex; align-items: center; gap: 8px; }
.ai-chd-l span { font-size: 0.8rem; font-weight: 600; color: #C8CEDF; }
.live-pill { padding:2px 9px; border-radius:var(--r-full); background:var(--teal); color:#fff; font-size:0.62rem; font-weight:700; letter-spacing:0.04em; box-shadow: 0 0 10px rgba(15,191,189,0.4); }
.ai-cb { padding: 18px; }
.ai-pt-name { font-size: 0.8rem; font-weight: 650; color: #D5DAF0; }
.ai-pt-sub  { font-size: 0.72rem; color: #7A82A0; margin-top: 2px; }
.ai-div { height:1px; background: rgba(255,255,255,0.06); margin: 12px 0; }
.ai-lbl { font-size: 0.72rem; font-weight: 650; color: #D5DAF0; margin-bottom: 8px; }
.ai-diags { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.ai-dr { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; background: rgba(255,255,255,0.04); border-radius: var(--r-xs); transition: background 0.15s; }
.ai-dr:hover { background: rgba(255,255,255,0.08); }
.ai-dn { font-size: 0.74rem; color: #B8BFDA; }
.pct { font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: var(--r-full); }
.ph { background: rgba(22,194,111,0.15); color: var(--green); }
.pm { background: var(--blue-50); color: var(--blue); }
.pl { background: rgba(255,255,255,0.07); color: #7A82A0; }
.soap { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--r-sm); padding: 11px 12px; margin-bottom: 9px; }
.soap-t { font-size: 0.7rem; font-weight: 650; color: #D5DAF0; margin-bottom: 5px; }
.soap-b { font-size: 0.67rem; color: #7A82A0; line-height: 1.65; }
.soap-k { color: #B8BFDA; font-weight: 600; }
.rx { background: rgba(17,112,239,0.13); border: 1px solid rgba(17,112,239,0.22); border-radius: var(--r-sm); padding: 10px 12px; display: flex; align-items: center; gap: 9px; }
.rx strong { font-size: 0.73rem; color: #F0F2FF; display: block; font-weight: 650; }
.rx span   { font-size: 0.66rem; color: #7A82A0; }

/* ─────────────────────────────────────────────────────────────
   CORE MODULES
───────────────────────────────────────────────────────────── */
.mods { background: var(--surface); }
.mods-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
.mc {
  background: var(--white); border-radius: var(--r-lg);
  padding: 26px 22px 24px; border: 1px solid var(--line);
  position: relative; overflow: hidden;
  transition: transform 0.3s var(--ease), box-shadow 0.3s, border-color 0.3s;
}
.mc:hover { transform: translateY(-5px); box-shadow: var(--s-lg); border-color: transparent; }
.mc::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; border-radius:0 0 var(--r-lg) var(--r-lg); opacity:0; transform:scaleX(0.5); transition: opacity 0.3s, transform 0.3s var(--ease); }
.mc:hover::after { opacity:1; transform:scaleX(1); }
.mc-blue::after   { background: linear-gradient(90deg, var(--blue), #5BADFF); }
.mc-teal::after   { background: linear-gradient(90deg, var(--teal), #6EE7E7); }
.mc-purple::after { background: linear-gradient(90deg, var(--purple), #A78BFA); }
.mc-green::after  { background: linear-gradient(90deg, var(--green), #6EEDC7); }
.mc-amber::after  { background: linear-gradient(90deg, var(--amber), #FCD34D); }
.mc-slate::after  { background: linear-gradient(90deg, #64748B, #94A3B8); }
.mc-top { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.mc-ico { width:40px; height:40px; border-radius:var(--r-sm); display:grid; place-items:center; font-size:1.1rem; flex-shrink:0; transition: transform 0.3s var(--ease); }
.mc:hover .mc-ico { transform: scale(1.1) rotate(-4deg); }
.ico-b { background: var(--blue-50); }
.ico-t { background: var(--teal-50); }
.ico-p { background: var(--purple-50); }
.ico-g { background: var(--green-50); }
.ico-a { background: var(--amber-50); }
.ico-s { background: var(--surface-2); }
.mc-tag { position:absolute; top:18px; right:16px; font-size:0.6rem; font-weight:650; padding:3px 8px; border-radius:var(--r-full); letter-spacing:0.04em; }
.tag-b  { background:var(--blue-50);   color:var(--blue); }
.tag-t  { background:var(--teal-50);   color:var(--teal); }
.tag-p  { background:var(--purple-50); color:var(--purple); }
.tag-g  { background:var(--green-50);  color:var(--green); }
.tag-a  { background:var(--amber-50);  color:var(--amber); }
.tag-s  { background:var(--surface-2); color:var(--ink-60); }
.mc-list { list-style:none; display:flex; flex-direction:column; gap:7px; }
.mc-list li { display:flex; align-items:flex-start; gap:8px; font-size:0.8rem; color:var(--ink-60); line-height:1.45; }
.d { width:5px; height:5px; border-radius:50%; flex-shrink:0; margin-top:5px; }
.db { background:var(--blue); }
.dt { background:var(--teal); }
.dp { background:var(--purple); }
.dg { background:var(--green); }
.da { background:var(--amber); }
.ds { background:#94A3B8; }

/* ─────────────────────────────────────────────────────────────
   WORKFLOW
───────────────────────────────────────────────────────────── */
.wf-sec { background: var(--white); }
.wf-scroll { overflow-x: auto; padding: 8px 0 32px; }
.wf-scroll::-webkit-scrollbar { height: 4px; }
.wf-scroll::-webkit-scrollbar-track { background: var(--surface); border-radius: 4px; }
.wf-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.wf-track { display: flex; align-items: flex-start; min-width: max-content; padding: 16px 0 8px; }
.wf-step { display: flex; align-items: center; }
.wf-node { display: flex; flex-direction: column; align-items: center; gap: 12px; min-width: 106px; }
.wf-ring { width:68px; height:68px; border-radius:50%; display:grid; place-items:center; position:relative; cursor:default; transition: transform 0.3s var(--ease); }
.wf-ring:hover { transform: scale(1.12); }
.wf-ring::before { content:''; position:absolute; inset:-5px; border-radius:50%; border:2px solid transparent; transition: border-color 0.3s; }
.wf-ring:hover::before { border-color: rgba(17,112,239,0.25); }
.wf-em { font-size: 1.4rem; }
.wf-n { position:absolute; top:-4px; right:-3px; width:19px; height:19px; border-radius:50%; display:grid; place-items:center; font-size:0.58rem; font-weight:800; color:#fff; border:2px solid var(--white); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
.wf-lbl strong { font-size:0.75rem; font-weight:700; color:var(--ink); display:block; margin-bottom:1px; text-align:center; }
.wf-lbl span   { font-size:0.64rem; color:var(--ink-40); display:block; text-align:center; }
.wf-arr { display:flex; align-items:center; margin:0 2px; margin-top:-40px; color:var(--line); flex-shrink:0; }
.wf-line { width:36px; height:1.5px; background:currentColor; }
.wf-tip  { width:0; height:0; border-top:4px solid transparent; border-bottom:4px solid transparent; border-left:6px solid currentColor; }

.ws1 .wf-ring { background: rgba(17,112,239,0.10); } .ws1 .wf-n { background: var(--blue); }
.ws2 .wf-ring { background: rgba(17,112,239,0.07); } .ws2 .wf-n { background: var(--blue); }
.ws3 .wf-ring { background: var(--teal-50);        } .ws3 .wf-n { background: var(--teal); }
.ws4 .wf-ring { background: var(--purple-50);      } .ws4 .wf-n { background: var(--purple); }
.ws5 .wf-ring { background: var(--green-50);       } .ws5 .wf-n { background: var(--green); }
.ws6 .wf-ring { background: rgba(17,112,239,0.07); } .ws6 .wf-n { background: var(--blue); }
.ws7 .wf-ring { background: var(--amber-50);       } .ws7 .wf-n { background: var(--amber); }
.ws8 .wf-ring { background: var(--green-50);       } .ws8 .wf-n { background: var(--green); }
.ws9 .wf-ring { background: var(--teal-50);        } .ws9 .wf-n { background: var(--teal); }

/* ─────────────────────────────────────────────────────────────
   DIFFERENTIATORS
───────────────────────────────────────────────────────────── */
.diff-sec { background: linear-gradient(160deg, #EDF5FF 0%, #F8FAFF 60%, #ECF9F8 100%); }
.diff-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
.dc {
  background: var(--white); border-radius: var(--r-lg);
  padding: 30px 26px; border: 1px solid var(--line);
  display: flex; align-items: flex-start; gap: 18px;
  position: relative; overflow: hidden;
  transition: transform 0.3s var(--ease), box-shadow 0.3s, border-color 0.3s;
}
.dc::before { content:''; position:absolute; left:0; top:20px; bottom:20px; width:3.5px; border-radius:0 3px 3px 0; transition: top 0.3s, bottom 0.3s; }
.dc:hover::before { top:0; bottom:0; }
.dc-purple::before { background: linear-gradient(180deg, var(--purple), rgba(108,62,235,0.4)); }
.dc-blue::before   { background: linear-gradient(180deg, var(--blue), rgba(17,112,239,0.4)); }
.dc-green::before  { background: linear-gradient(180deg, var(--green), rgba(22,194,111,0.4)); }
.dc-amber::before  { background: linear-gradient(180deg, var(--amber), rgba(245,158,11,0.4)); }
.dc:hover { transform: translateY(-5px); box-shadow: var(--s-lg); border-color: transparent; }
.dc-ico { width:50px; height:50px; border-radius:var(--r-md); flex-shrink:0; display:grid; place-items:center; font-size:1.35rem; transition: transform 0.3s var(--ease); }
.dc:hover .dc-ico { transform: scale(1.08) rotate(-4deg); }
.dc-p .dc-ico { background: var(--purple-50); }
.dc-b .dc-ico { background: var(--blue-50); }
.dc-g .dc-ico { background: var(--green-50); }
.dc-a .dc-ico { background: var(--amber-50); }
.dc-body .dc-tag { display:inline-block; font-size:0.63rem; font-weight:650; padding:3px 9px; border-radius:var(--r-full); margin-bottom:7px; letter-spacing:0.04em; }
.dc-body h3 { font-size:1rem; margin-bottom:8px; }
.dc-body p  { font-size:0.84rem; line-height:1.60; }
.dtag-p { background:var(--purple-50); color:var(--purple); }
.dtag-b { background:var(--blue-50);   color:var(--blue); }
.dtag-g { background:var(--green-50);  color:var(--green); }
.dtag-a { background:var(--amber-50);  color:var(--amber); }

/* ─────────────────────────────────────────────────────────────
   CTA — 2-column with inline form
───────────────────────────────────────────────────────────── */
.cta-sec {
  background: linear-gradient(145deg, #0E1260 0%, #1A1FC4 40%, #2563EB 70%, #1D4ED8 100%);
  position: relative; overflow: hidden;
}
.cta-sec::before {
  content:''; position:absolute;
  width:700px; height:700px; border-radius:50%;
  background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 65%);
  left:-180px; top:-180px; pointer-events:none;
}
.cta-sec::after {
  content:''; position:absolute;
  width:500px; height:500px; border-radius:50%;
  background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 65%);
  right:-100px; bottom:-120px; pointer-events:none;
}
/* Subtle mesh dots overlay */
.cta-sec .cta-dots {
  position:absolute; inset:0; pointer-events:none; opacity:0.07;
  background-image: radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px);
  background-size: 28px 28px;
}
.cta-layout {
  display: grid; grid-template-columns: 1fr 1fr; gap: 72px;
  align-items: center; position: relative; z-index: 1;
}
/* Left side */
.cta-left {}
.cta-pill {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 6px 14px; border-radius: var(--r-full);
  background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.85);
  border: 1px solid rgba(255,255,255,0.18);
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em;
  margin-bottom: 24px;
}
.cta-sec h2 {
  color: #fff; max-width: 520px;
  font-size: clamp(1.9rem, 3.2vw, 2.75rem);
  margin-bottom: 10px;
}
.cta-sec h2 em {
  font-style: italic; font-weight: 800;
  color: var(--teal);
}
.cta-sub { color: rgba(255,255,255,0.72); font-size: 1.02rem; max-width: 440px; margin-bottom: 36px; line-height: 1.7; }
.cta-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
.btn-cta-white {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px; border-radius: var(--r-full);
  font-family: 'Inter', sans-serif; font-size: 0.92rem; font-weight: 700;
  color: var(--ink); background: #fff; cursor: pointer; text-decoration: none;
  border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: all 0.22s var(--ease); white-space: nowrap;
}
.btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.28); }
.btn-cta-outline {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px; border-radius: var(--r-full);
  font-family: 'Inter', sans-serif; font-size: 0.92rem; font-weight: 600;
  color: #fff; background: transparent; cursor: pointer; text-decoration: none;
  border: 1.5px solid rgba(255,255,255,0.35);
  transition: all 0.22s var(--ease); white-space: nowrap;
}
.btn-cta-outline:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.6); transform: translateY(-2px); }
.cta-trust-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.cta-trust-item { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.7); }
.cta-trust-item svg { stroke: var(--teal); fill: none; stroke-width: 2.5; flex-shrink: 0; }

/* Right side — form card */
.cta-form-card {
  background: rgba(255,255,255,0.10);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: var(--r-xl);
  padding: 36px 32px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.25);
}
.cta-form-card h3 {
  color: #fff; font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;
}
.cta-form-card .form-sub { font-size: 0.875rem; color: rgba(255,255,255,0.60); margin-bottom: 24px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.75); margin-bottom: 6px; letter-spacing: 0.02em; }
.form-group input,
.form-group select {
  width: 100%; padding: 11px 14px;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: var(--r-sm);
  font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 400;
  color: #fff; outline: none;
  transition: border-color 0.2s, background 0.2s;
  -webkit-appearance: none; appearance: none;
}
.form-group input::placeholder { color: rgba(255,255,255,0.38); }
.form-group input:focus,
.form-group select:focus {
  border-color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.14);
}
.form-group select { cursor: pointer; }
.form-group select option { background: #1A1FC4; color: #fff; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-book-demo {
  width: 100%; padding: 14px;
  background: var(--teal);
  border: none; border-radius: var(--r-sm);
  font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 700;
  color: #fff; cursor: pointer; margin-top: 4px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(15,191,189,0.45);
  transition: all 0.22s var(--ease);
}
.btn-book-demo:hover { background: #0DA8A6; box-shadow: 0 8px 28px rgba(15,191,189,0.55); transform: translateY(-2px); }
.form-privacy { font-size: 0.7rem; color: rgba(255,255,255,0.42); text-align: center; margin-top: 12px; }

/* ─────────────────────────────────────────────────────────────
   SIGN-IN MODAL
───────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(10, 12, 30, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 0.28s var(--ease);
}
.modal-overlay.open { opacity: 1; pointer-events: auto; }
.modal-box {
  background: var(--white); border-radius: var(--r-xl);
  padding: 40px 36px; width: 100%; max-width: 420px;
  box-shadow: var(--s-xl);
  transform: translateY(20px) scale(0.97);
  transition: transform 0.32s var(--ease), opacity 0.28s var(--ease);
  opacity: 0; position: relative;
}
.modal-overlay.open .modal-box { transform: translateY(0) scale(1); opacity: 1; }
.modal-close {
  position: absolute; top: 16px; right: 16px;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--surface-2); border: none; cursor: pointer;
  display: grid; place-items: center; color: var(--ink-60);
  font-size: 1rem; line-height: 1; transition: background 0.15s;
}
.modal-close:hover { background: var(--line); }
.modal-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
.modal-logo-icon { width:32px; height:32px; border-radius:8px; background: linear-gradient(135deg, #1170EF, #0A5BD4); display:grid; place-items:center; color:#fff; font-size:0.85rem; font-weight:800; box-shadow: 0 3px 10px rgba(17,112,239,0.3); }
.modal-logo span { font-weight: 800; font-size: 1rem; color: var(--ink); letter-spacing: -0.02em; }
.modal-box h3 { font-size: 1.35rem; font-weight: 800; color: var(--ink); margin-bottom: 4px; letter-spacing: -0.02em; }
.modal-box .modal-sub { font-size: 0.875rem; color: var(--ink-60); margin-bottom: 28px; }
.m-form-group { margin-bottom: 14px; }
.m-form-group label { display:block; font-size:0.75rem; font-weight:600; color:var(--ink-60); margin-bottom:5px; }
.m-form-group input {
  width:100%; padding:11px 14px; border-radius:var(--r-sm);
  border:1.5px solid var(--line); font-family:'Inter',sans-serif; font-size:0.875rem;
  color:var(--ink); background:var(--surface); outline:none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.m-form-group input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(17,112,239,0.12); background: var(--white); }
.m-form-group input::placeholder { color: var(--ink-40); }
.modal-forgot { font-size: 0.78rem; color: var(--blue); text-decoration: none; font-weight: 500; float: right; margin-top: -10px; margin-bottom: 20px; display: block; }
.modal-forgot:hover { text-decoration: underline; }
.btn-modal-signin {
  width:100%; padding:13px; background: var(--blue);
  border:none; border-radius:var(--r-sm);
  font-family:'Inter',sans-serif; font-size:0.9rem; font-weight:700;
  color:#fff; cursor:pointer; box-shadow: var(--s-blue);
  transition: all 0.22s var(--ease);
}
.btn-modal-signin:hover { background: var(--blue-dark); box-shadow: var(--s-blue-lg); transform: translateY(-1px); }
.modal-divider { display:flex; align-items:center; gap:10px; margin:20px 0; }
.modal-divider::before, .modal-divider::after { content:''; flex:1; height:1px; background:var(--line); }
.modal-divider span { font-size:0.72rem; color:var(--ink-40); font-weight:500; white-space:nowrap; }
.modal-footer-txt { text-align:center; font-size:0.8rem; color:var(--ink-60); }
.modal-footer-txt a { color:var(--blue); font-weight:600; text-decoration:none; }
.modal-footer-txt a:hover { text-decoration:underline; }

/* ─────────────────────────────────────────────────────────────
   FOOTER — Construction ERP style
───────────────────────────────────────────────────────────── */
.foot {
  background: #07090F;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.foot-main {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 80px;
  padding: 72px 0 56px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
/* Left column */
.foot-brand { }
.foot-logo {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; margin-bottom: 6px;
}
.foot-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #1170EF, #3B5BDB);
  display: grid; place-items: center;
  font-size: 1.1rem; font-weight: 800; color: #fff;
  box-shadow: 0 4px 14px rgba(17,112,239,0.35);
  flex-shrink: 0;
}
.foot-logo-text { display: flex; flex-direction: column; }
.foot-logo-name {
  font-size: 1.05rem; font-weight: 800;
  color: #fff; letter-spacing: -0.02em; line-height: 1.2;
}
.foot-logo-name span { color: var(--teal); }
.foot-logo-tagline {
  font-size: 0.72rem; font-weight: 500;
  color: rgba(255,255,255,0.35); letter-spacing: 0.02em; margin-top: 1px;
}
.foot-logo-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--teal); margin-left: 2px; margin-top: 2px;
  box-shadow: 0 0 8px rgba(15,191,189,0.6);
  display: inline-block;
}
.foot-desc {
  font-size: 0.9rem; color: rgba(255,255,255,0.45);
  line-height: 1.7; max-width: 420px; margin: 24px 0 32px;
}
.foot-contact-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.foot-contact-list li {
  display: flex; align-items: center; gap: 10px;
  font-size: 0.875rem; color: rgba(255,255,255,0.50);
  transition: color 0.2s;
}
.foot-contact-list li:hover { color: rgba(255,255,255,0.8); }
.foot-contact-list a {
  color: inherit; text-decoration: none; transition: color 0.2s;
}
.foot-contact-list a:hover { color: rgba(255,255,255,0.9); }
.foot-contact-list svg {
  width: 15px; height: 15px; flex-shrink: 0;
  stroke: rgba(255,255,255,0.35); fill: none; stroke-width: 1.8;
}
/* Right column */
.foot-nav-col { }
.foot-nav-label {
  font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.35);
  letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 22px;
}
.foot-nav-links { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.foot-nav-links a {
  font-size: 1rem; font-weight: 500; color: rgba(255,255,255,0.55);
  text-decoration: none; transition: color 0.2s;
}
.foot-nav-links a:hover { color: #fff; }
/* Bottom bar */
.foot-bottom {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 0; gap: 20px; flex-wrap: wrap;
}
.foot-copy { font-size: 0.78rem; color: rgba(255,255,255,0.28); }
.foot-social { display: flex; align-items: center; gap: 28px; }
.foot-social a {
  font-size: 0.82rem; font-weight: 500; color: rgba(255,255,255,0.35);
  text-decoration: none; transition: color 0.2s;
}
.foot-social a:hover { color: rgba(255,255,255,0.8); }

@media (max-width: 768px) {
  .foot-main { grid-template-columns: 1fr; gap: 48px; padding: 56px 0 40px; }
  .foot-bottom { flex-direction: column; text-align: center; gap: 12px; }
  .foot-social { justify-content: center; }
}

/* ─────────────────────────────────────────────────────────────
   RESPONSIVE
───────────────────────────────────────────────────────────── */
@media (max-width:1024px) {
  .wrap { padding: 0 28px; }
  .hero-grid { gap: 48px; }
  .ai-layout { gap: 52px; }
  .mods-grid { grid-template-columns: repeat(2,1fr); }
  .cta-layout { gap: 48px; }
}
@media (max-width:768px) {
  .sec, .sec-l { padding: 72px 0; }
  .hero { padding: 72px 0; }
  .hero-grid { grid-template-columns: 1fr; gap: 52px; }
  .ai-layout { grid-template-columns: 1fr; gap: 52px; }
  .overview-grid { grid-template-columns: 1fr; }
  .mods-grid { grid-template-columns: 1fr; }
  .diff-grid { grid-template-columns: 1fr; }
  .cta-layout { grid-template-columns: 1fr; gap: 48px; }
  .nav-menu, .nav-end .btn-s { display: none; }
  .burger { display: flex; }
  .hero-btns { flex-direction: column; }
  .hero-btns .btn { justify-content: center; }
  .foot-row { flex-direction: column; text-align: center; }
  .foot-links { justify-content: center; }
  .btn-signin, .btn-reqdemo { display: none; }
}
@media (max-width:480px) {
  h1 { font-size: 2.1rem; }
  h2 { font-size: 1.7rem; }
  .wrap { padding: 0 20px; }
  .cta-btns { flex-direction: column; align-items: flex-start; }
  .dc { flex-direction: column; gap: 14px; }
  .form-row { grid-template-columns: 1fr; }
  .modal-box { padding: 28px 20px; margin: 0 16px; }
}
` }} />
      <nav className="nav" id="nav">
  <div className="wrap">
    <div className="nav-row">
      <a href="#!" onClick={(e) => e.preventDefault()} className="nav-logo">
        <img src="/icons8-medical-bag-100.png" alt="ClinicPro Icon" className="nav-icon-img" style={{width:'36px',height:'36px',objectFit:'contain',borderRadius:'10px'}} />
        Innonsh ClinicPro
      </a>
      <ul className="nav-menu">
        <li><a href="#overview" onClick={(e) => handleSmoothScroll(e, '#overview')}>Features</a></li>
        <li><a href="#modules" onClick={(e) => handleSmoothScroll(e, '#modules')}>Modules</a></li>
        <li><a href="#workflow" onClick={(e) => handleSmoothScroll(e, '#workflow')}>Workflow</a></li>
        <li><a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Contact</a></li>
      </ul>
      <div className="nav-end">
        <a onClick={navigateToLogin} href="/login" className="btn-signin" id="nav-signin-btn">Sign in</a>
        <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')} className="btn-reqdemo" id="nav-demo-btn">Request Demo <span className="btn-reqdem-arrow">↗</span></a>
      </div>
      <button className="burger" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>

{/**/}
<section className="hero">
  <div className="hero-orb orb-1"></div>
  <div className="hero-orb orb-2"></div>
  <div className="hero-orb orb-3"></div>
  <div className="wrap">
    <div className="hero-grid">
      <div>
        <div className="hero-badge"><span className="badge-dot"></span>AI-Powered Healthcare ERP</div>
        <h1>Next-Generation<br /><span className="accent-word">Healthcare</span><br />Platform</h1>
        <p className="hero-sub"> Innonsh ClinicPro unifies patient management, AI-assisted diagnostics, smart queuing, prescriptions, and billing into one seamless system — built for modern clinics and hospitals.</p>
        <div className="hero-btns">
          <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')} className="btn btn-p btn-lg">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Book a Demo
          </a>
          <a href="#modules" onClick={(e) => handleSmoothScroll(e, '#modules')} className="btn btn-s btn-lg">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Explore Modules
          </a>
        </div>
        <div className="hero-trust">
          <div className="t-chip"><div className="t-check"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3"/></svg></div>HIPAA Compliant</div>
          <div className="t-chip"><div className="t-check"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3"/></svg></div>Enterprise Security</div>
          <div className="t-chip"><div className="t-check"><svg viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3"/></svg></div>Real-time Sync</div>
        </div>
      </div>

      <div className="mockup">
        <div className="mk-bar">
          <div className="mk-dots"><span></span><span></span><span></span></div>
          <div className="mk-url">clinicpro.io/dashboard</div>
        </div>
        <div className="mk-body">
          <div className="mk-stats">
            <div className="mk-stat b"><div className="mk-val">248</div><div className="mk-lbl">Patients Today</div></div>
            <div className="mk-stat t"><div className="mk-val">12</div><div className="mk-lbl">In Queue</div></div>
            <div className="mk-stat g"><div className="mk-val">₹84K</div><div className="mk-lbl">Revenue</div></div>
            <div className="mk-stat p"><div className="mk-val">6</div><div className="mk-lbl">Doctors Active</div></div>
          </div>
          <div className="mk-qlabel"><span className="live-dot"></span>Live Queue</div>
          <div className="mk-qrow"><div className="mk-av" style={{"background":"#1170EF"}}>RS</div><div className="mk-name">Riya Sharma</div><div className="mk-st st-a">In Consult</div></div>
          <div className="mk-qrow"><div className="mk-av" style={{"background":"#6C3EEB"}}>MP</div><div className="mk-name">Mahesh Patil</div><div className="mk-st st-n">Next · #2</div></div>
          <div className="mk-qrow"><div className="mk-av" style={{"background":"#0FBFBD"}}>AK</div><div className="mk-name">Anita Kulkarni</div><div className="mk-st st-w">Waiting · #3</div></div>
          <div className="mk-ai"><span style={{"fontSize":"1rem"}}>🤖</span><p><strong>AI Diagnosis Ready</strong> — Smart Rx generated for Dr. Mehta</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

{/**/}
<div className="proof">
  <div className="wrap">
    <div className="proof-row">
      <div className="proof-lbl">Trusted by clinics across India</div>
      <div className="proof-sep"></div>
      <div className="proof-logos">
        <div className="proof-logo">Apollo Clinics</div>
        <div className="proof-sep"></div>
        <div className="proof-logo">MedPlus</div>
        <div className="proof-sep"></div>
        <div className="proof-logo">HealthFirst</div>
        <div className="proof-sep"></div>
        <div className="proof-logo">CarePoint</div>
        <div className="proof-sep"></div>
        <div className="proof-logo">VitalCare</div>
      </div>
    </div>
  </div>
</div>

{/**/}
<section className="overview sec" id="overview">
  <div className="wrap">
    <div className="sec-hd reveal">
      <div className="eyebrow">Product Overview</div>
      <h2>One Platform. Every Clinical Need.</h2>
      <p> Innonsh ClinicPro replaces fragmented tools with a unified, intelligent system that automates every step — from registration to billing and follow-up.</p>
    </div>
    <div className="overview-grid">
      <div className="pc pc-blue reveal d1">
        <div className="pc-icon pc-icon-b">🤖</div>
        <h3>AI-First Design</h3>
        <p>Embedded AI powers diagnosis suggestions, SOAP note auto-fill, and smart prescriptions — built into the core of the platform, not bolted on as an afterthought.</p>
      </div>
      <div className="pc pc-teal reveal d2">
        <div className="pc-icon pc-icon-t">⚡</div>
        <h3>Automation-First</h3>
        <p>WhatsApp confirmations, auto-generated follow-up reminders, and billing automation eliminate manual effort so your staff can focus entirely on patient care.</p>
      </div>
      <div className="pc pc-purple reveal d3">
        <div className="pc-icon pc-icon-p">🔗</div>
        <h3>Unified System</h3>
        <p>Reception, doctors, pharmacy, billing — all on one real-time platform. Every team sees the same live data with zero silos and zero miscommunication.</p>
      </div>
    </div>
  </div>
</section>

{/**/}
<section className="ai-sec sec-l">
  <div className="wrap">
    <div className="ai-layout">
      <div>
        <div className="eyebrow eyebrow-dark reveal">✦ AI-Powered Feature</div>
        <h2 className="reveal d1">AI-Powered<br />Consultation Suite</h2>
        <p className="ai-lead reveal d2">Your clinical team, amplified by intelligence. Every consultation becomes faster, smarter, and more precise.</p>
        <div className="ai-rows">
          <div className="ai-row reveal d3">
            <div className="ai-ico">🧠</div>
            <div><h4>AI Diagnosis Assist</h4><p>Real-time symptom analysis with differential diagnoses ranked by clinical probability, drawing from a vast medical knowledge base.</p></div>
          </div>
          <div className="ai-row reveal d4">
            <div className="ai-ico">💊</div>
            <div><h4>Smart Prescription</h4><p>Automated drug interaction checks, dosage recommendations, and template-based Rx generation that matches your prescribing style.</p></div>
          </div>
          <div className="ai-row reveal d5">
            <div className="ai-ico">📋</div>
            <div><h4>SOAP Notes Auto-fill</h4><p>Voice-to-structured SOAP note conversion with full EMR documentation generated in seconds — not minutes.</p></div>
          </div>
        </div>
      </div>

      <div className="ai-card reveal d2">
        <div className="ai-chd">
          <div className="ai-chd-l"><span>🤖</span><span>AI Consultation Assistant</span></div>
          <div className="live-pill">LIVE</div>
        </div>
        <div className="ai-cb">
          <div style={{"marginBottom":"12px"}}><div className="ai-pt-name">Patient: Riya Sharma, 32F</div><div className="ai-pt-sub">Chief Complaint: Persistent headache + fatigue, 5 days</div></div>
          <div className="ai-div"></div>
          <div className="ai-lbl">🧠 AI Diagnosis Suggestions</div>
          <div className="ai-diags">
            <div className="ai-dr"><div className="ai-dn">Tension-type headache</div><div className="pct ph">87%</div></div>
            <div className="ai-dr"><div className="ai-dn">Iron deficiency anemia</div><div className="pct pm">61%</div></div>
            <div className="ai-dr"><div className="ai-dn">Cervicogenic headache</div><div className="pct pl">34%</div></div>
          </div>
          <div className="soap">
            <div className="soap-t">📋 SOAP Note — Auto Generated</div>
            <div className="soap-b">
              <span className="soap-k">S:</span> Throbbing headache 7/10, worsened by screen use.<br />
              <span className="soap-k">O:</span> BP 118/76, HR 76bpm, pallor noted.<br />
              <span className="soap-k">A:</span> Tension headache + possible iron deficiency anemia.<br />
              <span className="soap-k">P:</span> CBC + ferritin ordered. Paracetamol + Iron supplementation.
            </div>
          </div>
          <div className="rx">
            <span style={{"fontSize":"1.1rem"}}>💊</span>
            <div className="rx"><strong>Smart Prescription Ready</strong><span>Paracetamol 500mg × TID × 5d &nbsp;·&nbsp; Iron 150mg × OD × 30d</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/**/}
<section className="mods sec" id="modules">
  <div className="wrap">
    <div className="sec-hd reveal">
      <div className="eyebrow">Core Modules</div>
      <h2>Everything Your Clinic Needs</h2>
      <p>9 deeply integrated modules covering every department — all working together in real time.</p>
    </div>
    <div className="mods-grid">

      <div className="mc mc-blue reveal d1">
        <div className="mc-tag tag-b">Core</div>
        <div className="mc-top"><div className="mc-ico ico-b">👥</div><h3>Patient Management</h3></div>
        <ul className="mc-list">
          <li><span className="d db"></span>Unified profile with full visit history &amp; cloud documents</li>
          <li><span className="d db"></span>Family linking, group registration, chronic disease tracking</li>
          <li><span className="d db"></span>ID upload, photo, and insurance card management</li>
        </ul>
      </div>

      <div className="mc mc-teal reveal d2">
        <div className="mc-tag tag-t">Smart</div>
        <div className="mc-top"><div className="mc-ico ico-t">📅</div><h3>Appointment System</h3></div>
        <ul className="mc-list">
          <li><span className="d dt"></span>Online &amp; walk-in booking with WhatsApp confirmation</li>
          <li><span className="d dt"></span>Doctor slot management and capacity controls</li>
          <li><span className="d dt"></span>Automated cancellation, reschedule &amp; reminder flows</li>
        </ul>
      </div>

      <div className="mc mc-purple reveal d3">
        <div className="mc-tag tag-p">AI</div>
        <div className="mc-top"><div className="mc-ico ico-p">⚡</div><h3>Smart Queue</h3></div>
        <ul className="mc-list">
          <li><span className="d dp"></span>Real-time digital token display for reception &amp; patients</li>
          <li><span className="d dp"></span>Priority-based queue with live wait-time estimates</li>
          <li><span className="d dp"></span>Patient SMS &amp; WhatsApp status notifications</li>
        </ul>
      </div>

      <div className="mc mc-green reveal d4">
        <div className="mc-tag tag-g">AI</div>
        <div className="mc-top"><div className="mc-ico ico-g">🩺</div><h3>Doctor EMR</h3></div>
        <ul className="mc-list">
          <li><span className="d dg"></span>AI-assisted SOAP note entry with voice-to-text</li>
          <li><span className="d dg"></span>Vitals, clinical findings, and lab result integration</li>
          <li><span className="d dg"></span>Full diagnosis history with ICD-10 coding</li>
        </ul>
      </div>

      <div className="mc mc-blue reveal d5">
        <div className="mc-tag tag-b">Smart</div>
        <div className="mc-top"><div className="mc-ico ico-b">💊</div><h3>Prescription System</h3></div>
        <ul className="mc-list">
          <li><span className="d db"></span>AI drug interaction alerts and dosage recommendations</li>
          <li><span className="d db"></span>Template-based Rx with personal favourite shortcuts</li>
          <li><span className="d db"></span>Digital PDF Rx with WhatsApp delivery to patients</li>
        </ul>
      </div>

      <div className="mc mc-amber reveal d6">
        <div className="mc-tag tag-a">Finance</div>
        <div className="mc-top"><div className="mc-ico ico-a">💰</div><h3>Billing &amp; Invoicing</h3></div>
        <ul className="mc-list">
          <li><span className="d da"></span>Auto-generated GST-compliant invoices from consultations</li>
          <li><span className="d da"></span>Insurance claim management and outstanding tracking</li>
          <li><span className="d da"></span>UPI, card, and cash support with revenue reports</li>
        </ul>
      </div>

      <div className="mc mc-teal reveal d7">
        <div className="mc-tag tag-t">Auto</div>
        <div className="mc-top"><div className="mc-ico ico-t">🔔</div><h3>Follow-up System</h3></div>
        <ul className="mc-list">
          <li><span className="d dt"></span>Automated follow-up scheduling post-consultation</li>
          <li><span className="d dt"></span>WhatsApp &amp; SMS reminder campaigns at set intervals</li>
          <li><span className="d dt"></span>Chronic disease review reminders and completion analytics</li>
        </ul>
      </div>

      <div className="mc mc-purple reveal d8">
        <div className="mc-tag tag-p">Ops</div>
        <div className="mc-top"><div className="mc-ico ico-p">🖥️</div><h3>Reception Dashboard</h3></div>
        <ul className="mc-list">
          <li><span className="d dp"></span>Single-screen daily workflow view for front desk staff</li>
          <li><span className="d dp"></span>Live patient flow monitor and quick walk-in registration</li>
          <li><span className="d dp"></span>Inter-department task routing and status tracking</li>
        </ul>
      </div>

      <div className="mc mc-slate reveal d9">
        <div className="mc-tag tag-s">Security</div>
        <div className="mc-top"><div className="mc-ico ico-s">🔒</div><h3>Security &amp; Access</h3></div>
        <ul className="mc-list">
          <li><span className="d ds"></span>Role-based access control (RBAC) per department and role</li>
          <li><span className="d ds"></span>End-to-end data encryption with full audit trail</li>
          <li><span className="d ds"></span>HIPAA-aligned data residency and compliance logging</li>
        </ul>
      </div>

    </div>
  </div>
</section>

{/**/}
<section className="wf-sec sec" id="workflow">
  <div className="wrap">
    <div className="sec-hd reveal">
      <div className="eyebrow">Patient Journey</div>
      <h2>End-to-End Workflow</h2>
      <p>One seamless journey. Zero dropped handoffs. Every step connected and automated in real time.</p>
    </div>
    <div className="wf-scroll reveal d1">
      <div className="wf-track">
        <div className="wf-step ws1"><div className="wf-node"><div className="wf-ring"><span className="wf-em">👤</span><div className="wf-n">1</div></div><div className="wf-lbl"><strong>Patient</strong><span>Arrives / Calls</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws2"><div className="wf-node"><div className="wf-ring"><span className="wf-em">📝</span><div className="wf-n">2</div></div><div className="wf-lbl"><strong>Registration</strong><span>Digital check-in</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws3"><div className="wf-node"><div className="wf-ring"><span className="wf-em">📅</span><div className="wf-n">3</div></div><div className="wf-lbl"><strong>Appointment</strong><span>Slot confirmed</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws4"><div className="wf-node"><div className="wf-ring"><span className="wf-em">⚡</span><div className="wf-n">4</div></div><div className="wf-lbl"><strong>Smart Queue</strong><span>Token issued</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws5"><div className="wf-node"><div className="wf-ring"><span className="wf-em">🩺</span><div className="wf-n">5</div></div><div className="wf-lbl"><strong>Doctor</strong><span>AI Consult</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws6"><div className="wf-node"><div className="wf-ring"><span className="wf-em">💊</span><div className="wf-n">6</div></div><div className="wf-lbl"><strong>Prescription</strong><span>Digital Rx sent</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws7"><div className="wf-node"><div className="wf-ring"><span className="wf-em">💰</span><div className="wf-n">7</div></div><div className="wf-lbl"><strong>Billing</strong><span>Auto invoice</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws8"><div className="wf-node"><div className="wf-ring"><span className="wf-em">✅</span><div className="wf-n">8</div></div><div className="wf-lbl"><strong>Payment</strong><span>UPI / Card / Cash</span></div></div></div>
        <div className="wf-arr"><div className="wf-line"></div><div className="wf-tip"></div></div>
        <div className="wf-step ws9"><div className="wf-node"><div className="wf-ring"><span className="wf-em">🔔</span><div className="wf-n">9</div></div><div className="wf-lbl"><strong>Follow-up</strong><span>Auto-scheduled</span></div></div></div>
      </div>
    </div>
  </div>
</section>

{/**/}
<section className="diff-sec sec">
  <div className="wrap">
    <div className="sec-hd reveal">
      <div className="eyebrow">Why  Innonsh ClinicPro</div>
      <h2>Built Different. Built Better.</h2>
      <p>These aren't just features — they're the architectural decisions that make  Innonsh ClinicPro the most capable healthcare platform in the market.</p>
    </div>
    <div className="diff-grid">
      <div className="dc dc-purple dc-p reveal d1">
        <div className="dc-ico">🤖</div>
        <div className="dc-body"><div className="dc-tag dtag-p">Exclusive</div><h3>AI-Powered Consultation</h3><p>Not an add-on AI. Built-in diagnosis assist, smart Rx generation, and SOAP auto-fill that continuously learns from your clinic's patterns and protocols.</p></div>
      </div>
      <div className="dc dc-blue dc-b reveal d2">
        <div className="dc-ico">⚡</div>
        <div className="dc-body"><div className="dc-tag dtag-b">Operational</div><h3>Real-Time Queue System</h3><p>Live digital token display with patient SMS &amp; WhatsApp alerts. Zero confusion at reception, full visibility for all clinical staff at all times.</p></div>
      </div>
      <div className="dc dc-green dc-g reveal d3">
        <div className="dc-ico">💬</div>
        <div className="dc-body"><div className="dc-tag dtag-g">Patient-First</div><h3>WhatsApp Integration</h3><p>Appointments, prescriptions, reminders, and lab reports delivered via WhatsApp — the channel your patients already use and trust every day.</p></div>
      </div>
      <div className="dc dc-amber dc-a reveal d4">
        <div className="dc-ico">⚙️</div>
        <div className="dc-body"><div className="dc-tag dtag-a">Efficiency</div><h3>Automation-First System</h3><p>Follow-ups, billing, reminders, and reports are triggered automatically based on clinical events. Your staff focuses on care, not administration.</p></div>
      </div>
    </div>
  </div>
</section>

{/**/}
<section className="cta-sec sec-l" id="contact">
  <div className="cta-dots"></div>
  <div className="wrap" style={{"position":"relative","zIndex":"1"}}>
    <div className="cta-layout">

      {/**/}
      <div className="cta-left reveal">
        <div className="cta-pill">🚀 Ready when you are</div>
        <h2>Ready to transform your<br /><em>healthcare workflow?</em></h2>
        <p className="cta-sub">Join clinics and hospitals across India running smarter operations, leaner queues, and cleaner billing — with  Innonsh ClinicPro.</p>
        <div className="cta-btns">
          <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')} className="btn-cta-white" >
            Request Demo →
          </a>
          <a href="#!" onClick={(e) => e.preventDefault()} className="btn-cta-outline" id="cta-signin-btn">Contact Sales</a>
        </div>
        <div className="cta-trust-row">
          <div className="cta-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            30-day pilot
          </div>
          <div className="cta-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Migration assistance
          </div>
          <div className="cta-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Local support
          </div>
        </div>
      </div>

      {/**/}
      <div className="cta-form-card reveal d2">
        <h3>Get a 20-min walkthrough</h3>
        <p className="form-sub">Tell us a bit about your clinic or hospital.</p>

        <form id="demo-form" onSubmit={handleDemoSubmit}>
          <div className="form-group">
            <label htmlFor="demo-form-email">Work email</label>
            <input type="email" id="demo-form-email" name="email" placeholder="you@clinic.com" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="demo-name">Your name</label>
              <input type="text" id="demo-name" name="name" placeholder="Dr. Sharma" required />
            </div>
            <div className="form-group">
              <label htmlFor="demo-phone">Phone number</label>
              <input type="tel" id="demo-phone" name="phone" placeholder="+91 9800000000" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="demo-clinic">Clinic / Hospital name</label>
            <input type="text" id="demo-clinic" name="clinic" placeholder="Apex Multi-Specialty Clinic" required />
          </div>
          <div className="form-group">
            <label htmlFor="demo-size">Daily patient volume</label>
            <select id="demo-size" name="size">
              <option value="">Select range</option>
              <option>1–30 patients/day</option>
              <option>30–100 patients/day</option>
              <option>100–300 patients/day</option>
              <option>300+ patients/day</option>
            </select>
          </div>
          <button type="submit" className="btn-book-demo">
            Book my demo
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
        </form>
        <p className="form-privacy">🔒 Your information is private and never shared.</p>
      </div>

    </div>
  </div>
</section>

{/**/}
<div className="modal-overlay" id="signin-modal" role="dialog" aria-modal="true" aria-label="Sign in to  Innonsh ClinicPro">
  <div className="modal-box">
    <button className="modal-close" id="modal-close-btn" aria-label="Close">✕</button>
    <div className="modal-logo">
      <div className="modal-logo-icon">D</div>
      <span> Innonsh ClinicPro</span>
    </div>
    <h3>Welcome back</h3>
    <p className="modal-sub">Sign in to your clinic dashboard</p>

    <form id="signin-form" onSubmit={handleSignIn}>
      <div className="m-form-group">
        <label htmlFor="si-email">Email address</label>
        <input type="email" id="si-email" name="email" placeholder="doctor@clinic.com" required />
      </div>
      <div className="m-form-group">
        <label htmlFor="si-password">Password</label>
        <input type="password" id="si-password" name="password" placeholder="••••••••••" required />
      </div>
      <a href="#!" onClick={(e) => e.preventDefault()} className="modal-forgot">Forgot password?</a>
      <button type="submit" className="btn-modal-signin">Sign in to  Innonsh ClinicPro</button>
    </form>

    <div className="modal-divider"><span>Don't have an account?</span></div>
    <p className="modal-footer-txt">
      <a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')} id="modal-get-demo">Request a free demo →</a>
    </p>
  </div>
</div>

{/**/}
<footer className="foot">
  <div className="wrap">

    {/**/}
    <div className="foot-main">

      {/**/}
      <div className="foot-brand">
        <a href="#!" onClick={(e) => e.preventDefault()} className="foot-logo">
          <div className="foot-icon">I</div>
          <div className="foot-logo-text">
            <div className="foot-logo-name">Innonsh <span>ClinicPro</span> <span className="foot-logo-dot"></span></div>
            <div className="foot-logo-tagline">Diagnose. Manage. Heal.</div>
          </div>
        </a>
        <p className="foot-desc">A modern, all-in-one healthcare ERP designed for clinics and hospitals that want smarter workflows, leaner queues, and cleaner billing.</p>
        <ul className="foot-contact-list">
          <li>
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Pune, Maharashtra, India
          </li>
          <li>
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.5 10.58a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 8a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <a href="tel:+918446544495">+91 84465 44495</a> / <a href="tel:+917620301874">+91 76203 01874</a>
          </li>
        </ul>
      </div>

      {/**/}
      <div className="foot-nav-col">
        <div className="foot-nav-label">Product</div>
        <ul className="foot-nav-links">
          <li><a href="#modules" onClick={(e) => handleSmoothScroll(e, '#modules')}>Modules</a></li>
          <li><a href="#overview" onClick={(e) => handleSmoothScroll(e, '#overview')}>Features</a></li>
          <li><a href="#workflow" onClick={(e) => handleSmoothScroll(e, '#workflow')}>How it works</a></li>
          <li><a href="#contact" onClick={(e) => handleSmoothScroll(e, '#contact')}>Request demo</a></li>
        </ul>
      </div>

    </div>

    {/**/}
    <div className="foot-bottom">
      <p className="foot-copy">© 2026  Innonsh ClinicPro. All rights reserved for Innonsh Technologies.</p>
      <div className="foot-social">
        <a href="#!" onClick={(e) => e.preventDefault()}>LinkedIn</a>
        <a href="#!" onClick={(e) => e.preventDefault()}>Twitter</a>
        <a href="#!" onClick={(e) => e.preventDefault()}>YouTube</a>
      </div>
    </div>

  </div>
</footer>
    </div>
  );
}
