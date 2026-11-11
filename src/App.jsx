import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'
import Manage from './Manage.jsx'
import ProjectDetail from './ProjectDetail.jsx'

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
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState('İşler hazırlanıyor')
  const [showSplash, setShowSplash] = useState(true)
  const [splashLeaving, setSplashLeaving] = useState(false)

  useEffect(() => {
    if (projectState === 'loading') return
    setSplashLeaving(true)
    const timeout = window.setTimeout(() => setShowSplash(false), 340)
    return () => window.clearTimeout(timeout)
  }, [projectState])

  useEffect(() => {
    if (window.location.pathname !== '/') return
    let active = true
    const splashMinimum = new Promise((resolve) => window.setTimeout(resolve, 520))

    async function preparePortfolio() {
      if (!supabase) {
        await splashMinimum
        if (active) {
          setLoadingStage('Portfolyo hazır')
          setLoadingProgress(100)
          setProjectState('empty')
        }
        return
      }

      const { data, error } = await supabase.from('portfolio_projects').select('*').eq('published', true).order('sort_order').order('created_at', { ascending: false })
      if (!active) return
      if (error) {
        await splashMinimum
        if (active) {
          setLoadingStage('Portfolyo açılamadı')
          setLoadingProgress(100)
          setProjectState('error')
        }
        return
      }

      const rows = data || []
      setProjects(rows)
      const covers = rows.filter((project) => project.cover_path).map((project) => supabase.storage.from('portfolio-media').getPublicUrl(project.cover_path).data.publicUrl)
      setLoadingStage(covers.length ? 'Kapak görselleri yükleniyor' : 'Portfolyo hazırlanıyor')

      if (covers.length) {
        let loadedCount = 0
        await Promise.all(covers.map((url) => new Promise((resolve) => {
          const image = new Image()
          let settled = false
          const finish = async (decodeImage) => {
            if (settled) return
            settled = true
            if (decodeImage && image.decode) await image.decode().catch(() => {})
            loadedCount += 1
            if (active) setLoadingProgress(Math.round((loadedCount / covers.length) * 100))
            resolve()
          }
          image.onload = () => finish(true)
          image.onerror = () => finish(false)
          image.src = url
          if (image.complete) finish(image.naturalWidth > 0)
        })))
      } else {
        setLoadingProgress(100)
      }

      await splashMinimum
      if (active) {
        setLoadingStage('Portfolyo hazır')
        setProjectState(rows.length ? 'ready' : 'empty')
      }
    }

    preparePortfolio()
    return () => { active = false }
  }, [])

  if (window.location.pathname === '/manage') return <Manage />
  const detailMatch = window.location.pathname.match(/^\/project\/([^/]+)\/?$/)
  if (detailMatch) return <ProjectDetail projectId={detailMatch[1]} />

  return (
    <>
      {showSplash && <div className={`home-splash ${splashLeaving ? 'is-leaving' : ''}`} role="status" aria-live="polite" aria-label={`Portfolyo hazırlanıyor, yüzde ${loadingProgress}`}>
        <div className="splash-brand"><span className="splash-wordmark">ZY<span>.</span></span><span className="splash-caption">Zeynep Yılmaz <i /> Portfolyo</span></div>
        <div className="splash-center"><p className="splash-kicker">ORDU · GRAFİK TASARIM</p><h1>Birazdan<br /><em>buradayız.</em></h1><div className="splash-progress" role="progressbar" aria-label="Kapak görselleri yükleniyor" aria-valuemin="0" aria-valuemax="100" aria-valuenow={loadingProgress}><span style={{ transform: `scaleX(${loadingProgress / 100})` }} /></div><div className="splash-status"><span>{loadingStage}</span><span>{String(loadingProgress).padStart(2, '0')}%</span></div></div>
        <span className="splash-index">GÖRSEL İLETİŞİM <i /> 2026</span>
      </div>}
      <a className="skip-link" href="#icerik" inert={showSplash}>İçeriğe geç</a>
      <header className="site-header" inert={showSplash}>
        <a className="wordmark" href="#anasayfa" aria-label="Zeynep Yılmaz, ana sayfa">ZY<span>.</span></a>
        <nav className="main-nav" aria-label="Ana menü">
          <a href="#isler">İşler</a>
          <a href="#hakkimda">Hakkımda</a>
          <a className="nav-contact" href="#iletisim">İletişim <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main id="icerik" inert={showSplash}>
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
              const href = `/project/${project.id}`
              const Visual = href ? 'a' : 'div'
              return <article className="live-project" key={project.id}>
                <Visual className="live-project-visual" href={href || undefined} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer' : undefined} aria-label={href ? `${project.title} projesini incele` : undefined}>
                  {coverUrl ? <img className="live-project-cover" src={coverUrl} alt={`${project.title} kapak görseli`} width="900" height="900" loading={index < 2 ? 'eager' : 'lazy'} onLoad={(event) => event.currentTarget.classList.toggle('is-portrait', event.currentTarget.naturalHeight > event.currentTarget.naturalWidth)} /> : <div className="live-project-art" aria-hidden="true" />}
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

      <footer className="site-footer" inert={showSplash}><a className="wordmark" href="#anasayfa">ZY<span>.</span></a><p>Zeynep Yılmaz · Grafik tasarımcı</p><span>© 2026</span></footer>
    </>
  )
}

export default App
