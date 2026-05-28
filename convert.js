const fs = require('fs');
const html = fs.readFileSync('C:/Users/pc/Downloads/docerp-portfolio (1).html', 'utf-8');

let css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
// Replace :root with .landing-wrapper
css = css.replace(/:root/g, '.landing-wrapper');

let bodyHtml = html.match(/<nav[\s\S]*?<\/footer>/)[0];

// Convert class to className
bodyHtml = bodyHtml.replace(/class=/g, 'className=');

// Convert inline styles
// style="background:#1170EF" -> style={{background: '#1170EF'}}
bodyHtml = bodyHtml.replace(/style=\"([^\"]+)\"/g, (match, p1) => {
  let styleObj = {};
  p1.split(';').forEach(s => {
    if (!s.trim()) return;
    let [key, val] = s.split(':');
    if (!key || !val) return;
    let camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
    styleObj[camelKey] = val.trim();
  });
  return 'style={' + JSON.stringify(styleObj) + '}';
});

// Fix SVG attributes
bodyHtml = bodyHtml.replace(/stroke-width/g, 'strokeWidth');
bodyHtml = bodyHtml.replace(/stroke-linecap/g, 'strokeLinecap');
bodyHtml = bodyHtml.replace(/stroke-linejoin/g, 'strokeLinejoin');

// Close input tags
bodyHtml = bodyHtml.replace(/<input([^>]+?)(?<!\/)>/g, '<input$1 />');

// Close br tags
bodyHtml = bodyHtml.replace(/<br>/g, '<br />');

// Remove onclick from HTML (we'll handle it in react or remove if not needed)
bodyHtml = bodyHtml.replace(/onclick=\"[^\"]+\"/g, '');

const pageJs = `'use client';
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
      card.style.transform = \`translateY(-5px) rotateY(\${x * 4}deg) rotateX(\${-y * 4}deg)\`;
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

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-book-demo');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = 'Booking…';
    btn.disabled = true;
    btn.style.background = 'rgba(255,255,255,0.2)';
    setTimeout(() => {
      btn.innerHTML = '✓ Demo booked! We\\'ll reach out within 24 hrs.';
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
      <style dangerouslySetInnerHTML={{ __html: \`${css.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\` }} />
      ${bodyHtml.replace(/href="#signin-modal"/g, 'onClick={navigateToLogin} href="/login"')}
    </div>
  );
}
`;

fs.writeFileSync('C:/Users/pc/Desktop/1905 DOC/Doctor_ERP/src/app/page.js', pageJs);
console.log('Done!');
