import { useEffect, useRef, useState } from 'react';
import { SquaresFourIcon } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { CopyIcon } from '@phosphor-icons/react/dist/csr/Copy';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { ArrowUpIcon } from '@phosphor-icons/react/dist/csr/ArrowUp';
import '@fontsource-variable/manrope';
import content from './content.json';

const LANGUAGE_KEY = 'kheladze-portfolio-language-v1';
const CASE_HISTORY_KEY = 'kheladzePortfolioCase';
const ORDER = content.order;
const FILTERS = ['all', 'web', 'ios', 'backend', 'ai', 'enterprise'];
const PROJECTS = content.projects;

function storedLanguage() {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY) === 'ru' ? 'ru' : 'en';
  } catch {
    return 'en';
  }
}

function readRoute() {
  const params = new URLSearchParams(window.location.search);
  const language = params.get('lang');
  const id = params.get('case');
  return {
    language: language === 'en' || language === 'ru' ? language : storedLanguage(),
    caseId: Object.hasOwn(PROJECTS, id) ? id : null,
  };
}

function relativeUrl(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function projectImage(id, detail = false) {
  return `${import.meta.env.BASE_URL}assets/${detail ? PROJECTS[id].detailImage : PROJECTS[id].image}.webp`;
}

function isPlainClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function Reveal({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function App() {
  const [route, setRoute] = useState(readRoute);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [serviceId, setServiceId] = useState('web');
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const closeRef = useRef(null);
  const menuButtonRef = useRef(null);
  const workHeadingRef = useRef(null);
  const emailRef = useRef(null);
  const copyTimerRef = useRef(null);
  const backdropPointerRef = useRef(false);
  const closingCaseRef = useRef(false);
  const language = route.language;
  const copy = content.locales[language];
  const activeService = copy.services.items.find(service => service.id === serviceId);
  const cases = Object.fromEntries(copy.cases.map((project) => [project.id, project]));
  const activeCase = route.caseId ? cases[route.caseId] : null;
  const isCaseOpen = Boolean(activeCase);
  const matchesFilter = (id) => filter === 'all' || PROJECTS[id].filters.includes(filter);
  const visibleProjects = ORDER.filter(matchesFilter);
  const activeIndex = ORDER.indexOf(route.caseId);
  const adjacentIds = activeIndex < 0 ? [ORDER[0], ORDER[1]] : [ORDER[(activeIndex - 1 + ORDER.length) % ORDER.length], ORDER[(activeIndex + 1) % ORDER.length]];

  useEffect(() => {
    function handlePopState() {
      closingCaseRef.current = false;
      setRoute(readRoute());
      setMenuOpen(false);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = activeCase ? `${activeCase.title} — ${copy.name}` : copy.meta.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = activeCase ? activeCase.brief : copy.meta.description;
    const socialTitle = document.querySelector('meta[property="og:title"]');
    const socialDescription = document.querySelector('meta[property="og:description"]');
    if (socialTitle) socialTitle.content = document.title;
    if (socialDescription) socialDescription.content = description?.content || copy.meta.description;
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Language selection also works when browser storage is unavailable.
    }
  }, [language, copy.meta.title, copy.meta.description, activeCase]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isCaseOpen) {
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      closeRef.current?.focus({ preventScroll: true });
    } else if (dialog.open) {
      dialog.close();
      const opener = openerRef.current;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else workHeadingRef.current?.focus({ preventScroll: true });
      openerRef.current = null;
    }
  }, [route.caseId, isCaseOpen]);

  useEffect(() => {
    if (!isCaseOpen) return;
    const oldBodyOverflow = document.body.style.overflow;
    const oldHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = oldBodyOverflow;
      document.documentElement.style.overflow = oldHtmlOverflow;
    };
  }, [isCaseOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function dismissMenu(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', dismissMenu);
    return () => document.removeEventListener('keydown', dismissMenu);
  }, [menuOpen]);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  function switchLanguage(nextLanguage) {
    if (nextLanguage === language) return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLanguage);
    window.history.replaceState(window.history.state, '', relativeUrl(url));
    setRoute((current) => ({ ...current, language: nextLanguage }));
  }

  function caseHref(id) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', language);
    url.searchParams.set('case', id);
    url.hash = '';
    return relativeUrl(url);
  }

  function openCase(event, id) {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    closingCaseRef.current = false;
    openerRef.current = event.currentTarget;
    window.history.pushState(
      { ...window.history.state, [CASE_HISTORY_KEY]: true }, '', caseHref(id),
    );
    setRoute((current) => ({ ...current, caseId: id }));
    setMenuOpen(false);
  }

  function closeCase() {
    if (!route.caseId || closingCaseRef.current) return;
    if (window.history.state?.[CASE_HISTORY_KEY]) {
      closingCaseRef.current = true;
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('case');
    const state = { ...window.history.state };
    delete state[CASE_HISTORY_KEY];
    window.history.replaceState(state, '', relativeUrl(url));
    setRoute((current) => ({ ...current, caseId: null }));
  }

  async function copyEmail() {
    let copied = false;
    try {
      await navigator.clipboard.writeText(content.identity.email);
      copied = true;
    } catch {
      const focusedElement = document.activeElement;
      const input = document.createElement('textarea');
      input.value = content.identity.email;
      input.readOnly = true;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      input.remove();
      if (focusedElement instanceof HTMLElement && focusedElement.isConnected) {
        focusedElement.focus({ preventScroll: true });
      }
    }
    setEmailCopied(copied);
    window.clearTimeout(copyTimerRef.current);
    if (copied) copyTimerRef.current = window.setTimeout(() => setEmailCopied(false), 2500);
    else emailRef.current?.focus();
  }

  function navigateCase(id) {
    window.history.replaceState(window.history.state, '', caseHref(id));
    setRoute((current) => ({ ...current, caseId: id }));
  }

  function scrollCaseTo(id) {
    const section = dialogRef.current?.querySelector(`#${id}`);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  const navLinks = [
    { href: '#work', label: copy.nav.work },
    { href: '#expertise', label: copy.nav.services },
    { href: '#about', label: copy.nav.process },
  ];

  return (
    <div className={`portfolio lang-${language}`} id="top">
      <a className="skip-link" href="#main">{copy.ui.skip}</a>
      <header className="header">
        <a className="wordmark" href="#top" aria-label={copy.name}><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>{copy.name}</a>
        <nav className="desktop-nav" aria-label={copy.ui.menu}>{navLinks.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
        <div className="language-switch" role="group" aria-label={copy.nav.language}>
          <button type="button" lang="en" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => switchLanguage('en')}>EN</button><span aria-hidden="true">/</span>
          <button type="button" lang="ru" className={language === 'ru' ? 'active' : ''} aria-pressed={language === 'ru'} onClick={() => switchLanguage('ru')}>RU</button>
        </div>
        <a className="primary-button header-cta" href="#contact">{copy.hero.secondaryAction}<ArrowUpRightIcon size={18} aria-hidden="true" /></a>
        <button className="menu-toggle" type="button" ref={menuButtonRef} aria-expanded={menuOpen} aria-controls={menuOpen ? 'mobile-navigation' : undefined} aria-label={menuOpen ? copy.ui.close : copy.ui.menu} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <XIcon size={25} aria-hidden="true" /> : <ListIcon size={25} aria-hidden="true" />}</button>
        {menuOpen ? <nav className="mobile-nav" id="mobile-navigation" aria-label={copy.ui.menu}>{[...navLinks,{href:'#contact',label:copy.hero.secondaryAction}].map(link => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}<ArrowUpRightIcon size={20} aria-hidden="true" /></a>)}</nav> : null}
      </header>
      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="hero-title">{copy.hero.title.map((line,index) => <span key={line} className={index ? 'accent' : ''}>{line}</span>)}</h1>
            <p className="hero-description">{copy.hero.description}</p>
            <div className="hero-actions">
              <a className="primary-button" href="#contact">{copy.hero.secondaryAction}<ArrowUpRightIcon size={21} aria-hidden="true" /></a>
              <a className="text-link" href="#work">{copy.hero.primaryAction}<ArrowRightIcon size={19} aria-hidden="true" /></a>
            </div>
            <p className="hero-footnote">{copy.hero.footnote}</p>
          </div>
          <aside className="hero-selection" aria-labelledby="selection-title">
            <div className="selection-heading"><p id="selection-title">{copy.hero.selectionTitle}</p></div>
            <div className="selection-list">{(copy.hero.selectedProjects || []).map(item => <a className="selection-link" key={item.id} href={caseHref(item.id)} onClick={event => openCase(event, item.id)} aria-haspopup="dialog">
              <img src={projectImage(item.id)} alt="" width="180" height="120" decoding="async" />
              <div><span className="selection-kind">{item.label}</span><h2>{cases[item.id].title}</h2><p>{item.description}</p></div>
              <ArrowUpRightIcon size={22} aria-hidden="true" />
            </a>)}</div>
            {copy.hero.selectionDisclosure ? <p className="selection-disclosure">{copy.hero.selectionDisclosure}</p> : null}
            <a className="selection-all" href="#work">{copy.hero.selectionNote}<ArrowRightIcon size={18} aria-hidden="true" /></a>
          </aside>
        </section>
        <nav className="capability-strip" aria-label={copy.ui.scope}>{copy.services.items.map((service,index) => <a href="#expertise" key={service.id} onClick={() => setServiceId(service.id)}><span>{String(index+1).padStart(2,'0')}</span>{copy.hero.capabilities[index]}<ArrowUpRightIcon size={15} aria-hidden="true" /></a>)}</nav>
        <section className="work-section" id="work" aria-labelledby="work-title">
          <Reveal><p className="eyebrow">{copy.work.eyebrow}</p><div className="section-heading"><h2 id="work-title" tabIndex={-1} ref={workHeadingRef}>{copy.work.title}<span className="project-total">({ORDER.length})</span></h2><p>{copy.work.description}</p></div></Reveal>
          <p className="presentation-note">{copy.ui.portfolioNote}</p>
          <div className="work-controls">
            <div className="filters" role="group" aria-label={copy.work.eyebrow}>{FILTERS.map(id => <button key={id} type="button" className={filter === id ? 'selected' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}>{copy.ui[id]}<span>{id === 'all' ? ORDER.length : ORDER.filter(key => PROJECTS[key].filters.includes(id)).length}</span></button>)}</div>
            <div className="view-controls" role="group" aria-label={language === 'ru' ? 'Вид каталога' : 'Catalogue view'}><button type="button" aria-label={copy.ui.grid} title={copy.ui.grid} aria-pressed={view === 'grid'} onClick={() => setView('grid')}><SquaresFourIcon size={21} aria-hidden="true" /></button><button type="button" aria-label={copy.ui.list} title={copy.ui.list} aria-pressed={view === 'list'} onClick={() => setView('list')}><ListIcon size={23} aria-hidden="true" /></button></div>
          </div>
          <p className="sr-only" role="status">{copy.ui.showing}: {visibleProjects.length}</p>
          <div className={`project-grid view-${view} ${filter !== 'all' ? 'filtered' : ''}`}>
            {visibleProjects.map((id,index) => { const project = cases[id]; return <article className="project" key={id}>
              <a className="project-link" href={caseHref(id)} onClick={event => openCase(event,id)} aria-haspopup="dialog" aria-label={`${copy.ui.detail}: ${project.title}`}>
                <div className="case-visual"><img src={projectImage(id)} alt={`${project.title} · ${copy.ui.concept}`} width="1440" height="960" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" /><span className="project-number">{String(ORDER.indexOf(id)+1).padStart(2,'0')}</span><span className="visual-label">{copy.ui.conceptShort}</span><span className="view-project-arrow" aria-hidden="true"><ArrowUpRightIcon size={30} /></span></div>
                <div className="project-info"><p className="project-category">{project.category}</p><div className="project-title-row"><h3>{project.title}</h3><ArrowUpRightIcon size={25} aria-hidden="true" /></div><p className="project-brief">{project.brief}</p><div className="project-bottom"><span>{project.stack.slice(0,3).join(' · ')}</span><span className="project-cta">{copy.ui.readCase}<ArrowRightIcon size={16} aria-hidden="true" /></span></div></div>
              </a>
            </article>; })}
          </div>
        </section>
        <section className="expertise-section" id="expertise" aria-labelledby="expertise-title">
          <Reveal><p className="eyebrow">{copy.services.eyebrow}</p><div className="section-heading"><h2 id="expertise-title">{copy.services.title}</h2><p>{copy.services.description}</p></div></Reveal>
          <div className="expertise-layout">
            <div className="expertise-nav" role="group" aria-label={copy.ui.scope}>{copy.services.items.map((service,index) => <button type="button" className={serviceId===service.id?'selected':''} aria-pressed={serviceId===service.id} aria-controls="service-panel" key={service.id} onClick={() => setServiceId(service.id)}>
              <span className="service-number">{String(index+1).padStart(2,'0')}</span>
              <span className="service-tile-title">{service.title}</span>
              <ArrowUpRightIcon className="service-tile-arrow" size={19} aria-hidden="true" />
            </button>)}</div>
            <div id="service-panel" className={`service-panel service-${activeService.id}`} key={activeService.id}>
              <div className="service-topline"><span className="eyebrow">{copy.ui.serviceScope}</span></div>
              <div className="service-panel-heading"><h3>{activeService.title}</h3></div><p className="service-description">{activeService.description}</p>
              <ul className="service-deliveries">{activeService.scope.map(item => <li key={item}><CheckIcon size={18} aria-hidden="true" />{item}</li>)}</ul>
              <div className="stack-list">{activeService.stack.map(item => <span key={item}>{item}</span>)}</div>
              <div className="service-cases"><p className="eyebrow">{copy.ui.serviceWork}</p><div className="service-case-grid">{activeService.cases.map(id => <a className="service-case" key={id} href={caseHref(id)} onClick={event=>openCase(event,id)} aria-haspopup="dialog"><img src={projectImage(id)} width="1440" height="960" alt="" loading="lazy" /><span>{cases[id].title}</span><ArrowUpRightIcon size={18} aria-hidden="true" /></a>)}</div>{activeService.id==='ios'?<a className="service-extra-link" href={caseHref('hybrid-ios')} onClick={event=>openCase(event,'hybrid-ios')} aria-haspopup="dialog">{copy.ui.webviewLink}<ArrowUpRightIcon size={19} aria-hidden="true" /></a>:null}</div>
            </div>
          </div>
        </section>
        <section className="about-section" id="about" aria-labelledby="about-title">
          <Reveal className="about-intro"><div className="about-topline"><p className="eyebrow">{copy.nav.process}</p></div><h2 id="about-title">{copy.ui.about}</h2><p>{copy.ui.aboutBody}</p><div className="about-ownership"><p className="ownership-note">{copy.ui.aboutNote}</p><a className="text-link" href={content.identity.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRightIcon size={20} aria-hidden="true" /></a></div></Reveal>
          <div className="process-panel"><p className="eyebrow">{copy.process.eyebrow}</p><div className="process-list">{copy.process.steps.map((step,index)=><details key={step.id} open={index===0?true:undefined}><summary><span>{String(index+1).padStart(2,'0')}</span><strong className="process-step-title">{step.title}</strong><PlusIcon className="details-icon" size={20} aria-hidden="true" /></summary><p>{step.description}</p></details>)}</div><div className="tech-note"><h3>{copy.ui.techTitle}</h3><p>{copy.ui.techBody}</p></div></div>
        </section>
        <section className="contact-section" id="contact" aria-labelledby="contact-title"><Reveal><p className="eyebrow">{copy.contact.eyebrow}</p><div className="contact-heading"><h2 id="contact-title">{copy.contact.title}</h2></div><p className="contact-description">{copy.contact.description}</p><div className="contact-actions"><a className="primary-button" href={`mailto:${content.identity.email}?subject=${encodeURIComponent(language === 'ru' ? 'Обсудить проект' : 'Project enquiry')}`}>{copy.ui.email}<ArrowUpRightIcon size={20} aria-hidden="true" /></a><a className="text-link" href={content.identity.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRightIcon size={18} aria-hidden="true" /></a></div><div className="footer-contact"><a className="email-link" ref={emailRef} href={`mailto:${content.identity.email}`} aria-label={`${copy.ui.email}: ${content.identity.email}`}>{content.identity.email}</a><button className="copy-email" type="button" aria-label={copy.ui.copyEmail} title={copy.ui.copyEmail} onClick={copyEmail}>{emailCopied?<CheckIcon size={20} aria-hidden="true" />:<CopyIcon size={20} aria-hidden="true" />}</button><span className="copy-status" role="status" aria-live="polite">{emailCopied?copy.ui.emailCopied:''}</span></div></Reveal></section>
      </main>
      <footer><a className="wordmark" href="#top">{copy.name}<span>.</span></a><span className="footer-note">FULLSTACK ENGINEER · APPLIED AI</span><a className="github-link" href={content.identity.github} target="_blank" rel="noopener noreferrer" aria-label={copy.contact.githubAction}>GitHub<ArrowUpRightIcon size={18} aria-hidden="true" /></a><a className="top-link" href="#top" aria-label={copy.ui.backToTop} title={copy.ui.backToTop}><ArrowUpIcon size={21} aria-hidden="true" /></a></footer>

      <dialog className="case-dialog" ref={dialogRef} aria-labelledby="case-title"
        onCancel={(event) => { event.preventDefault(); closeCase(); }}
        onPointerDown={(event) => { backdropPointerRef.current = event.target === event.currentTarget; }}
        onClick={(event) => {
          if (backdropPointerRef.current && event.target === event.currentTarget) closeCase();
          backdropPointerRef.current = false;
        }}>
        {activeCase ? (
          <div className="case-sheet">
            <div className="case-toolbar">
              <span>{activeIndex >= 0 ? `${String(activeIndex + 1).padStart(2, '0')} / ${ORDER.length}` : 'iOS'} <span className="toolbar-category">{activeCase.category}</span></span>
              <button className="close-button" type="button" ref={closeRef} onClick={closeCase} aria-label={copy.work.closeAction}>
                {copy.ui.close}<XIcon size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="case-intro" key={activeCase.id}>
              <p className="eyebrow">{activeCase.category}</p>
              <h2 id="case-title">{activeCase.title}</h2>
              <p className="case-lede">{activeCase.brief}</p>
            </div>
            <div className="case-cover">
              <div className="case-facts">
                {activeCase.audience ? <div><h3>{copy.ui.audience}</h3><p>{activeCase.audience}</p></div> : null}
                {activeCase.role ? <div><h3>{copy.ui.role}</h3><p>{activeCase.role}</p></div> : null}
                <div><h3>{copy.ui.stack}</h3><ul className="stack-list">{activeCase.stack.map(tool => <li key={tool}>{tool}</li>)}</ul></div>
              </div>
              <figure>
                <img src={projectImage(activeCase.id)} alt={`${activeCase.title} · ${copy.ui.concept}`} width="1440" height="960" decoding="async" />
                <figcaption>{copy.work.conceptExplanation}</figcaption>
              </figure>
            </div>
            <div className="case-layout">
              <nav className="case-toc" aria-label={copy.ui.detail}>
                <button type="button" onClick={() => scrollCaseTo('case-context')}>{copy.ui.overview}</button>
                <button type="button" onClick={() => scrollCaseTo('case-modules')}>{copy.ui.modules}</button>
                {PROJECTS[activeCase.id].detailImage ? <button type="button" onClick={() => scrollCaseTo('case-visuals')}>{copy.ui.visuals}</button> : null}
                {activeCase.flow ? <button type="button" onClick={() => scrollCaseTo('case-flow')}>{activeCase.flowTitle || copy.ui.workflow}</button> : null}
                {activeCase.engineering ? <button type="button" onClick={() => scrollCaseTo('case-engineering')}>{copy.ui.engineering}</button> : null}
                <button type="button" onClick={() => scrollCaseTo('case-delivery')}>{copy.ui.deliverables}</button>
              </nav>
              <div className="case-story">
                <section tabIndex={-1} id="case-context">
                  <h3>{copy.ui.overview}</h3>
                  {activeCase.overview ? <p>{activeCase.overview}</p> : null}
                  <div className="task-callout"><h4>{copy.work.problemLabel}</h4><p>{activeCase.problem}</p></div>
                  {activeCase.valueText ? <div className="project-value"><p className="eyebrow">{copy.ui.value}</p><h4>{activeCase.valueTitle}</h4><p>{activeCase.valueText}</p></div> : null}
                </section>
                <section tabIndex={-1} id="case-modules">
                  <h3>{copy.ui.modules}</h3>
                  {activeCase.modules ? <div className="module-grid">{activeCase.modules.map(item => <article key={item.title}><h4>{item.title}</h4><p>{item.text}</p></article>)}</div>
                    : <ul className="delivery-list">{activeCase.implementation.map(item => <li key={item}>{item}</li>)}</ul>}
                </section>
                {PROJECTS[activeCase.id].detailImage ? <section tabIndex={-1} id="case-visuals" className="case-visual-section">
                  <h3>{copy.ui.visuals}</h3>
                  <figure className="walkthrough-figure">
                    <a href={projectImage(activeCase.id, true)} target="_blank" rel="noopener noreferrer" aria-label={copy.ui.openImage}>
                      <img src={projectImage(activeCase.id, true)} alt={`${activeCase.title} — ${copy.ui.visuals}. ${copy.ui.galleryNote}`} width="1440" height="960" loading="lazy" decoding="async" />
                    </a>
                    <figcaption><span>{copy.ui.galleryNote}</span><a href={projectImage(activeCase.id, true)} target="_blank" rel="noopener noreferrer">{copy.ui.openImage}<ArrowUpRightIcon size={16} aria-hidden="true" /></a></figcaption>
                  </figure>
                </section> : null}
                {activeCase.flow ? <section tabIndex={-1} id="case-flow">
                  <h3>{activeCase.flowTitle || copy.ui.workflow}</h3>
                  <ol className="flow-list">{activeCase.flow.map((step, index) => <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol>
                </section> : null}
                {activeCase.engineering ? <section tabIndex={-1} id="case-engineering">
                  <h3>{copy.ui.engineering}</h3>
                  <div className="engineering-list">{activeCase.engineering.map(item => <article key={item.title}><h4>{item.title}</h4><p>{item.text}</p></article>)}</div>
                </section> : null}
                <section tabIndex={-1} id="case-delivery">
                  <h3>{copy.ui.deliverables}</h3>
                  {activeCase.deliverables ? <ul className="delivery-list">{activeCase.deliverables.map(item => <li key={item}><CheckIcon size={18} aria-hidden="true" /><span>{item}</span></li>)}</ul> : null}
                  <p className="result-note">{activeCase.whatResultIsVerified}</p>
                </section>
                <a className="text-link case-contact" href={`mailto:${content.identity.email}?subject=${encodeURIComponent(activeCase.title)}`}>{copy.ui.contactProject}<ArrowUpRightIcon size={20} aria-hidden="true" /></a>
              </div>
            </div>
            <div className="case-navigation">
              {adjacentIds.map((id, index) => <button type="button" key={id} onClick={() => navigateCase(id)}><span>{index === 0 ? copy.ui.previous : copy.ui.next}</span><strong>{cases[id].title}</strong>{index === 1 ? <ArrowRightIcon size={24} aria-hidden="true" /> : null}</button>)}
            </div>
            <button className="back-to-work" type="button" onClick={closeCase}>{copy.ui.back}<ArrowUpRightIcon size={22} aria-hidden="true" /></button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
