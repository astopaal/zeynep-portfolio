import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'
import Manage from './Manage.jsx'

const formats = [
  {
    number: '01',
    title: 'Basılı işler',
    detail: 'PDF, katalog ve yayın tasarımları',
    className: 'format-print',
    mark: 'Aa',
  },
  {
    number: '02',
    title: 'Web tasarımı',
    detail: 'Web siteleri ve dijital arayüzler',
    className: 'format-web',
    mark: '↗',
  },
  {
    number: '03',
    title: 'Sosyal medya',
    detail: 'Instagram gönderileri ve kampanyalar',
    className: 'format-social',
    mark: '▧',
  },
  {
    number: '04',
    title: 'Hareketli işler',
    detail: 'Video, animasyon ve motion tasarım',
    className: 'format-motion',
    mark: '▶',
  },
]

function App() {
  const [projects, setProjects] = useState([])
  const [projectState, setProjectState] = useState('loading')

  useEffect(() => {
    if (!supabase) {
      setProjectState('empty')
      return
    }
    supabase.from('portfolio_projects').select('*').eq('published', true).order('sort_order').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setProjectState('error')
        else {
          setProjects(data || [])
          setProjectState(data?.length ? 'ready' : 'empty')
        }
      })
  }, [])

  if (window.location.pathname === '/manage') return <Manage />

  return (
    <>
      <a className="skip-link" href="#icerik">İçeriğe geç</a>
      <header className="site-header">
        <a className="wordmark" href="#anasayfa" aria-label="Zeynep Yılmaz, ana sayfa">ZY<span>.</span></a>
        <nav className="main-nav" aria-label="Ana menü">
          <a href="#isler">İşler</a>
          <a href="#hakkimda">Hakkımda</a>
          <a className="nav-contact" href="#iletisim">İletişim <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main id="icerik">
        <section className="hero" id="anasayfa" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" aria-hidden="true" /> Grafik tasarımcı · Ordu</p>
            <h1 id="hero-title">Fikirleri<br /><span>görünür</span> kılarım.</h1>
            <div className="hero-bottom">
              <p>Ben Zeynep Yılmaz. Basılı ve dijital mecralar için karakteri olan görsel işler tasarlıyorum.</p>
              <a className="text-link" href="#isler">İşlerimi gör <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-paper"><span className="paper-index">Görsel not&nbsp; / &nbsp;01</span><span className="paper-word">fikir<br />→ form</span><span className="paper-stamp">ZY<br />2026</span></div>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <span className="art-caption">Farklı mecralar,<br />aynı tasarım dili.</span>
          </div>
          <div className="hero-edge" aria-hidden="true"><span>Görsel iletişim / 2026</span><span>01 — 04</span></div>
        </section>

        <section className="work-section section-pad" id="isler" aria-labelledby="work-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Portfolyo / seçili işler</p>
              <h2 id="work-title">Bir fikir,<br /><em>birçok biçim.</em></h2>
            </div>
            <p className="section-intro">Her mecra için ayrı düşünülmüş, birlikte aynı görsel dünyada duran tasarımlar.</p>
          </div>
          {projectState === 'loading' && <p className="work-note" role="status">Portfolyo işleri yükleniyor…</p>}
          {projectState === 'error' && <p className="work-note" role="status">İşler şu anda yüklenemedi. Lütfen daha sonra tekrar bak.</p>}
          {projectState === 'empty' && <div className="format-grid">
            {formats.map((format) => (
              <article className={`format-card ${format.className}`} key={format.number}>
                <div className="format-art" aria-hidden="true"><span className="format-mark">{format.mark}</span><span className="format-number">{format.number} / 04</span><span className="format-caption">Çalışma alanı</span></div>
                <div className="format-meta"><div><h3>{format.title}</h3><p>{format.detail}</p></div></div>
              </article>
            ))}
          </div>}
          {projects.length > 0 && <div className="live-project-grid">
            {projects.map((project, index) => {
              const fileUrl = project.media_path ? supabase.storage.from('portfolio-media').getPublicUrl(project.media_path).data.publicUrl : null
              const coverUrl = project.cover_path ? supabase.storage.from('portfolio-media').getPublicUrl(project.cover_path).data.publicUrl : null
              const href = project.external_url || fileUrl
              const Visual = href ? 'a' : 'div'
              return <article className="live-project" key={project.id}>
                <Visual className="live-project-visual" href={href || undefined} target={href ? '_blank' : undefined} rel={href ? 'noreferrer' : undefined} aria-label={href ? `${project.title} projesini incele` : undefined}>
                  {coverUrl ? <img className="live-project-cover" src={coverUrl} alt={`${project.title} kapak görseli`} width="900" height="620" loading={index < 2 ? 'eager' : 'lazy'} /> : <div className="live-project-art" aria-hidden="true" />}
                  <div className="live-project-overlay"><p>{project.category}</p><h3>{project.title}</h3>{href && <span className="project-open-label">İncele <span aria-hidden="true">↗</span></span>}</div>
                </Visual>
                {project.description && <p className="live-project-description">{project.description}</p>}
              </article>
            })}
          </div>}
        </section>

        <section className="about-section" id="hakkimda" aria-labelledby="about-title">
          <div className="about-side"><span>02 / Hakkımda</span><span className="side-mark" aria-hidden="true">✳</span></div>
          <div className="about-content">
            <p className="eyebrow">Merhaba, ben Zeynep</p>
            <h2 id="about-title">Görsel dünyaları<br />bir araya getiriyorum.</h2>
            <div className="about-lower">
              <p>Grafik tasarım alanında; basılı yayınlardan dijital içeriklere, sosyal medya tasarımlarından videoya uzanan işler üretiyorum. Her projede mecranın ihtiyacını gözetirken ortak bir görsel dil kurmayı önemsiyorum.</p>
              <a className="outline-link" href="#iletisim">Birlikte çalışalım <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </section>

        <section className="contact-section" id="iletisim" aria-labelledby="contact-title">
          <p className="eyebrow">03 / İletişim</p>
          <h2 id="contact-title">Aklında bir fikir<br />var mı?</h2>
          <p className="contact-note">Proje konuşmak için WhatsApp’tan yazabilirsin.</p>
          <a className="whatsapp-link" href="https://wa.me/905455238699" target="_blank" rel="noreferrer">WhatsApp’tan yaz <span aria-hidden="true">↗</span></a>
          <a className="back-top" href="#anasayfa">Başa dön <span aria-hidden="true">↑</span></a>
        </section>
      </main>

      <footer className="site-footer"><a className="wordmark" href="#anasayfa">ZY<span>.</span></a><p>Zeynep Yılmaz · Grafik tasarımcı</p><span>© 2026</span></footer>
    </>
  )
}

export default App
