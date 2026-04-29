// app.jsx — main React app
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================
   Cursor — custom dot + ring with hover state
   ============================================ */
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
    };
    const checkHover = (e) => {
      const el = e.target.closest('a, button, .work-item, .skill-row, .service, .modal-close');
      if (ringRef.current) ringRef.current.classList.toggle('hover', !!el);
    };
    let raf;
    const tick = () => {
      ring.current.x += (target.current.x - ring.current.x) * 0.18;
      ring.current.y += (target.current.y - ring.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', checkHover);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', checkHover);
    };
  }, []);

  return (
    <React.Fragment>
      <div ref={dotRef} className="cursor-dot"></div>
      <div ref={ringRef} className="cursor-ring"></div>
    </React.Fragment>);

}

/* ============================================
   Scramble text
   ============================================ */
function useScramble(words, interval = 2400) {
  const [display, setDisplay] = useState(words[0]);
  const idx = useRef(0);
  useEffect(() => {
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    let raf;
    const scramble = (from, to, onDone) => {
      const len = Math.max(from.length, to.length);
      const queue = [];
      for (let i = 0; i < len; i++) {
        const fromC = from[i] || '';
        const toC = to[i] || '';
        const start = Math.floor(Math.random() * 20);
        const end = start + Math.floor(Math.random() * 20) + 8;
        queue.push({ fromC, toC, start, end, char: '' });
      }
      let frame = 0;
      const draw = () => {
        let out = '';
        let done = 0;
        for (const q of queue) {
          if (frame >= q.end) {done++;out += q.toC;} else
          if (frame >= q.start) {
            if (!q.char || Math.random() < 0.28) q.char = chars[Math.floor(Math.random() * chars.length)];
            out += q.char;
          } else out += q.fromC;
        }
        setDisplay(out);
        if (done === queue.length) onDone && onDone();else
        {frame++;raf = requestAnimationFrame(draw);}
      };
      draw();
    };
    const cycle = () => {
      const next = (idx.current + 1) % words.length;
      scramble(words[idx.current], words[next], () => {
        idx.current = next;
        setTimeout(cycle, interval);
      });
    };
    const t = setTimeout(cycle, interval);
    return () => {clearTimeout(t);cancelAnimationFrame(raf);};
  }, [words, interval]);
  return display;
}

/* ============================================
   Magnetic — wraps an element so it pulls toward cursor
   ============================================ */
function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const reset = () => {el.style.transform = '';};
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', reset);
    };
  }, [strength]);
  return <span ref={ref} className={className} style={{ display: 'inline-block', transition: 'transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1)' }}>{children}</span>;
}

/* ============================================
   Live clock for nav
   ============================================ */
function LiveClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const update = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      setT(`${hh}:${mm}:${ss} IST`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="nav-time">{t}</span>;
}

/* ============================================
   Reveal on scroll
   ============================================ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .skill-row');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ============================================
   Nav
   ============================================ */
function Nav() {
  return (
    <nav className="nav">
      <a href="#top" className="nav-brand"><b>M.</b> Tavakol</a>
      <div className="nav-links">
        <a href="#about">About</a>
        <a href="#experience">Experience</a>
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </div>
      <LiveClock />
    </nav>);

}

/* ============================================
   Hero
   ============================================ */
function Hero({ data }) {
  const heroRef = useRef(null);
  const portraitRef = useRef(null);
  const role = useScramble(data.roles);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 100;
      const y = (e.clientY - r.top) / r.height * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
      if (portraitRef.current) {
        const px = (x - 50) * 0.04;
        const py = (y - 50) * 0.04;
        portraitRef.current.style.transform = `scale(1.05) translate(${px}px, ${py}px)`;
      }
    };
    el.addEventListener('mousemove', move);
    return () => el.removeEventListener('mousemove', move);
  }, []);

  // parallax on scroll
  useEffect(() => {
    const onScroll = () => {
      if (!portraitRef.current) return;
      const y = window.scrollY * 0.3;
      portraitRef.current.style.translate = `0 ${y}px`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section ref={heroRef} className="hero" id="top">
      <div className="hero-portrait">
        <div ref={portraitRef} className="hero-portrait-img"></div>
      </div>
      <div className="hero-glow"></div>

      <div className="hero-content">
        <div className="hero-meta">
          <div className="hero-meta-block">
            <span className="label">Portfolio</span>
            <span className="value">VOL. 01 / 2026</span>
          </div>
          <div className="hero-meta-block" style={{ textAlign: 'center' }}>
            <span className="label">Status</span>
            <span className="value">◉ Available for work</span>
          </div>
          <div className="hero-meta-block" style={{ textAlign: 'right' }}>
            <span className="label">Coords</span>
            <span className="value">41.0°N 29.0°E</span>
          </div>
        </div>

        <div className="hero-greeting">Hello, world</div>

        <h1 className="hero-name">
          <span className="word"><span>Mamoun</span></span>{' '}
          <span className="word"><span><em>Tavakol.</em></span></span>
        </h1>

        <div className="hero-subline">
          <div className="hero-roles">
            <span className="dot"></span>
            <span>Currently:</span>
            <span className="scramble">{role}</span>
          </div>
        </div>

        <div className="hero-cta">
          <Magnetic>
            <a className="btn btn-primary" href="#work">
              <span>View work</span>
              <span className="arrow">→</span>
            </a>
          </Magnetic>
          <Magnetic>
            <a className="btn" href="https://mamoun-tavakol.netlify.app/Mamoun Resume.pdf" target="_blank" rel="noreferrer">
              <span>Download CV</span>
              <span className="arrow">↓</span>
            </a>
          </Magnetic>
        </div>
      </div>

      <div className="hero-scroll">
        <span>Scroll</span>
      </div>
    </section>);

}

/* ============================================
   Marquee
   ============================================ */
function Marquee() {
  const items = ['Software Engineer', 'Software Engineer', 'Software Engineer', 'Designer', 'Translator'];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[0, 1].map((k) =>
        <div key={k} className="marquee-item">
            {items.map((it, i) =>
          <React.Fragment key={i}>
                <span style={{ fontSize: "56px" }}>{it}</span>
                <span className="star">✦</span>
              </React.Fragment>
          )}
          </div>
        )}
      </div>
    </div>);

}

/* ============================================
   About
   ============================================ */
function About({ data }) {
  return (
    <section className="section" id="about">
      <div className="section-header reveal">
        <div>
          <div className="section-eyebrow"><span className="num">01 —</span> About</div>
          <h2 className="section-title">A quiet engineer<br />with a <em>diverse</em> compass.</h2>
        </div>
      </div>
      <div className="about-grid">
        <div className="reveal">
          <p className="about-text">{data.about.lead}</p>
          <p className="about-text">{data.about.body}</p>
        </div>
        <div className="about-facts reveal delay-1">
          {data.about.facts.map((f, i) =>
          <div key={i} className="fact">
              <span className="fact-label">{f.label}</span>
              <span className="fact-value">{f.value}</span>
            </div>
          )}
        </div>
      </div>
    </section>);

}

/* ============================================
   Experience timeline
   ============================================ */
function Experience({ data }) {
  return (
    <section className="section" id="experience">
      <div className="section-header reveal">
        <div>
          <div className="section-eyebrow"><span className="num">02 —</span> Experience</div>
          <h2 className="section-title">Six years across <em>code, classrooms</em><br />and conference rooms.</h2>
        </div>
      </div>
      <div className="timeline">
        {data.experience.map((e, i) =>
        <div key={i} className="tl-item reveal" style={{ transitionDelay: i * 0.05 + 's' }}>
            <div className="tl-date">{e.date}</div>
            <div className="tl-content">
              <div className="tl-role">{e.role}</div>
              <div className="tl-company">{e.company}</div>
              <div className="tl-blurb">{e.blurb}</div>
            </div>
            {e.image &&
          <div className="tl-image" style={{ backgroundImage: `url(${e.image})` }}></div>
          }
          </div>
        )}
      </div>
    </section>);

}

/* ============================================
   Skills
   ============================================ */
function Skills({ data }) {
  return (
    <section className="skills" id="skills">
      <div className="skills-inner">
        <div className="section-header reveal">
          <div>
            <div className="section-eyebrow"><span className="num">03 —</span> Skills</div>
            <h2 className="section-title">Languages I <em>think</em> in.</h2>
          </div>
        </div>
        <div className="skills-list">
          {data.skills.map((s, i) =>
          <div key={i} className="skill-row" style={{ '--pct': s.pct + '%' }}>
              <div className="skill-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="skill-name">{s.name}</div>
              <div className="skill-bar"><div className="skill-bar-fill"></div></div>
              <div className="skill-pct">{s.pct}%</div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

/* ============================================
   Work
   ============================================ */
function Work({ data, onOpen }) {
  const previewRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const move = (e) => {
      if (previewRef.current) {
        previewRef.current.style.left = e.clientX + 'px';
        previewRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <section className="section" id="work">
      <div className="section-header reveal">
        <div>
          <div className="section-eyebrow"><span className="num">04 —</span> Selected work</div>
          <h2 className="section-title">Things I've <em>built</em> & shipped.</h2>
        </div>
      </div>
      <div className="work-list">
        {data.work.map((w, i) =>
        <div
          key={i}
          className="work-item reveal"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onOpen(i)}>
          
            <div className="work-num">{String(i + 1).padStart(2, '0')} / {String(data.work.length).padStart(2, '0')}</div>
            <div className="work-title">{w.title}</div>
            <div className="work-tags">
              {w.tags.map((t, j) => <span key={j} className="work-tag">{t}</span>)}
            </div>
            <div className="work-arrow">↗</div>
          </div>
        )}
      </div>
      <div
        ref={previewRef}
        className={'work-preview' + (hovered !== null ? ' show' : '')}
        style={{ backgroundImage: hovered !== null ? `url(${data.work[hovered].image})` : 'none' }}>
      </div>
    </section>);

}

/* ============================================
   Modal
   ============================================ */
function Modal({ project, onClose }) {
  useEffect(() => {
    const onKey = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={'modal-backdrop' + (project ? ' open' : '')} onClick={onClose}>
      {project &&
      <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="modal-image" style={{ backgroundImage: `url(${project.image})` }}></div>
          <div className="modal-eyebrow">{project.kind} · {project.year}</div>
          <h3 className="modal-title">{project.title}</h3>
          <p className="modal-body" dangerouslySetInnerHTML={{ __html: project.body }}></p>
          <div className="modal-stack">
            {project.tags.map((t, i) => <span key={i} className="work-tag">{t}</span>)}
          </div>
        </div>
      }
    </div>);

}

/* ============================================
   Logos / Worked with
   ============================================ */
function Logos({ data }) {
  if (!data.logos || !data.logos.length) return null;
  const items = [...data.logos, ...data.logos];
  return (
    <section className="logos-section reveal">
      <div className="logos-eyebrow">
        <span>Worked with</span>
        <span className="logos-line"></span>
        <span className="logos-count">{String(data.logos.length).padStart(2, '0')} organizations</span>
      </div>
      <div className="logos-track-wrap">
        <div className="logos-track">
          {items.map((l, i) =>
          <div key={i} className="logo-cell" title={l.name}>
              <img src={l.src} alt={l.name} />
            </div>
          )}
        </div>
      </div>
    </section>);

}

/* ============================================
   Services
   ============================================ */
function Services({ data }) {
  return (
    <section className="section" id="services">
      <div className="section-header reveal">
        <div>
          <div className="section-eyebrow"><span className="num">05 —</span> Services</div>
          <h2 className="section-title">What I can <em>do</em> for you.</h2>
        </div>
      </div>
      <div className="services-grid reveal">
        {data.services.map((s, i) =>
        <div key={i} className="service">
            <div className="service-num">{String(i + 1).padStart(2, '0')}</div>
            <div className="service-title">{s.title}</div>
            <div className="service-desc">{s.desc}</div>
          </div>
        )}
      </div>
    </section>);

}

/* ============================================
   Contact
   ============================================ */
function Contact({ data }) {
  return (
    <section className="contact" id="contact">
      <div className="section-eyebrow reveal"><span className="num">06 —</span> Contact</div>
      <h2 className="contact-headline reveal delay-1">
        Have a project<br />
        in mind? <em>Let's</em><br />
        <a href={`mailto:${data.email}`}>say hello.</a>
      </h2>
      <div className="contact-grid">
        <div className="contact-card reveal">
          <div className="label">Email</div>
          <div className="value"><a href={`mailto:${data.email}`}>{data.email}</a></div>
        </div>
        <div className="contact-card reveal delay-1">
          <div className="label">Phone</div>
          <div className="value"><a href={`tel:${data.phone.replace(/\s/g, '')}`}>{data.phone}</a></div>
        </div>
        <div className="contact-card reveal delay-2">
          <div className="label">Based in</div>
          <div className="value">A. Mahmut Hüdayi Mah.<br />Üsküdar, İstanbul 34672</div>
        </div>
        <div className="contact-card reveal delay-3">
          <div className="label">Elsewhere</div>
          <div className="value">
            <a href="#">LinkedIn</a><br />
            <a href="#">GitHub</a>
          </div>
        </div>
      </div>
    </section>);

}

/* ============================================
   Tweaks
   ============================================ */
function PortfolioTweaks() {
  const [t, setT] = useTweaks(window.TWEAK_DEFAULTS);

  // Apply
  useEffect(() => {
    document.body.classList.remove('theme-warm', 'theme-cool', 'theme-paper', 'theme-forest');
    document.body.classList.add('theme-' + t.theme);
  }, [t.theme]);

  useEffect(() => {
    document.body.style.setProperty('cursor', t.customCursor ? 'none' : 'auto');
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot) dot.style.display = t.customCursor ? 'block' : 'none';
    if (ring) ring.style.display = t.customCursor ? 'block' : 'none';
  }, [t.customCursor]);

  useEffect(() => {
    document.body.style.setProperty('--grain-opacity', t.grain ? '0.45' : '0');
    document.querySelector('body').style.setProperty('--_g', t.grain ? '0.45' : '0');
    const style = document.getElementById('grain-toggle-style') || (() => {
      const s = document.createElement('style');
      s.id = 'grain-toggle-style';
      document.head.appendChild(s);
      return s;
    })();
    style.textContent = t.grain ? '' : 'body::before { opacity: 0 !important; }';
  }, [t.grain]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Theme">
        <TweakSelect
          label="Palette"
          value={t.theme}
          onChange={(v) => setT('theme', v)}
          options={[
          { value: 'warm', label: 'Warm noir (default)' },
          { value: 'cool', label: 'Cool indigo' },
          { value: 'paper', label: 'Paper & ink' },
          { value: 'forest', label: 'Forest green' }]
          } />
        
      </TweakSection>
      <TweakSection title="Effects">
        <TweakToggle label="Custom cursor" value={t.customCursor} onChange={(v) => setT('customCursor', v)} />
        <TweakToggle label="Film grain" value={t.grain} onChange={(v) => setT('grain', v)} />
      </TweakSection>
    </TweaksPanel>);

}

/* ============================================
   App
   ============================================ */
function App() {
  const data = window.PORTFOLIO_DATA;
  const [openIdx, setOpenIdx] = useState(null);
  useReveal();

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = openIdx !== null ? 'hidden' : '';
  }, [openIdx]);

  return (
    <React.Fragment>
      <CustomCursor />
      <Nav />
      <div className="shell">
        <Hero data={data} />
        <Marquee />
        <About data={data} />
        <Experience data={data} />
        <Skills data={data} />
        <Work data={data} onOpen={setOpenIdx} />
        <Logos data={data} />
        <Services data={data} />
        <Contact data={data} />
        <footer className="footer">
          <span>© 2026 — Mamoun Tavakol</span>
          <span>Designed & built in Istanbul</span>
        </footer>
      </div>
      <Modal project={openIdx !== null ? data.work[openIdx] : null} onClose={() => setOpenIdx(null)} />
      <PortfolioTweaks />
    </React.Fragment>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);