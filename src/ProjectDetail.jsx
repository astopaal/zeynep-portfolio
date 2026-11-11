import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './ProjectDetail.css'

export default function ProjectDetail({ projectId }) {
  const [project, setProject] = useState(null)
  const [gallery, setGallery] = useState([])
  const [state, setState] = useState('loading')
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let active = true
    async function loadProject() {
      if (!supabase) return setState('error')
      const { data, error } = await supabase.from('portfolio_projects').select('*').eq('id', projectId).eq('published', true).maybeSingle()
      if (!active) return
      if (error || !data) {
        setState('error')
        return
      }
      setProject(data)
      const { data: media, error: mediaError } = await supabase.from('portfolio_project_media').select('*').eq('project_id', projectId).order('sort_order').order('created_at')
      if (!active) return
      if (mediaError) {
        setState('error')
        return
      }
      setGallery(media || [])
      setState('ready')
      document.title = `${data.title} | Zeynep Yılmaz`
    }
    loadProject()
    return () => { active = false }
  }, [projectId])

  if (state === 'loading') return <main className="project-detail-state" role="status">Proje yükleniyor…</main>
  if (state === 'error') return <main className="project-detail-state"><a href="/">Portfolyoya dön</a><h1>Bu proje şu anda açılamıyor.</h1></main>

  const coverUrl = project.cover_path ? supabase.storage.from('portfolio-media').getPublicUrl(project.cover_path).data.publicUrl : null
  const mediaUrl = project.media_path ? supabase.storage.from('portfolio-media').getPublicUrl(project.media_path).data.publicUrl : null
  const slides = [
    ...(coverUrl ? [{ id: 'cover', url: coverUrl, label: 'Kapak görseli' }] : []),
    ...(mediaUrl && project.media_kind === 'image' ? [{ id: 'main-image', url: mediaUrl, label: 'Proje görseli' }] : []),
    ...gallery.map((item, index) => ({ id: item.id, url: supabase.storage.from('portfolio-media').getPublicUrl(item.file_path).data.publicUrl, label: `Galeri fotoğrafı ${index + 1}` })),
  ]
  const goToImage = (index) => setActiveImage((index + slides.length) % slides.length)

  return (
    <main className="project-detail">
      <header className="site-header detail-header"><a className="wordmark" href="/">ZY<span>.</span></a><nav className="main-nav" aria-label="Ana menü"><a href="/#isler">İşler</a><a href="/#hakkimda">Hakkımda</a><a className="nav-contact" href="/#iletisim">İletişim <span aria-hidden="true">↗</span></a></nav></header>
      <section className="detail-intro"><p className="eyebrow">{project.category} · Proje detayı</p><h1>{project.title}</h1><div className="detail-summary"><p>{project.description}</p>{project.external_url && <a className="detail-visit" href={project.external_url} target="_blank" rel="noreferrer">Canlı siteyi ziyaret et <span aria-hidden="true">↗</span></a>}</div></section>
      <section className="detail-gallery" aria-label="Proje görsel galerisi">
        {slides.length ? <>
          <div className="gallery-stage" aria-live="polite">
            <img key={slides[activeImage].id} src={slides[activeImage].url} alt={`${project.title} · ${slides[activeImage].label}`} width="1200" height="1200" fetchPriority={activeImage === 0 ? 'high' : 'auto'} />
            {slides.length > 1 && <><button className="gallery-control gallery-prev" type="button" aria-label="Önceki görsel" onClick={() => goToImage(activeImage - 1)}>‹</button><button className="gallery-control gallery-next" type="button" aria-label="Sonraki görsel" onClick={() => goToImage(activeImage + 1)}>›</button><span className="gallery-count">{String(activeImage + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span></>}
          </div>
          {slides.length > 1 && <div className="gallery-thumbnails" role="group" aria-label="Görsel seçimi">{slides.map((slide, index) => <button className={`gallery-thumb ${activeImage === index ? 'is-active' : ''}`} key={slide.id} type="button" aria-label={`${index + 1}. görseli göster`} aria-pressed={activeImage === index} onClick={() => goToImage(index)}><img src={slide.url} alt="" width="160" height="110" loading="lazy" /></button>)}</div>}
        </> : <p className="gallery-empty">Bu proje için henüz görsel eklenmemiş.</p>}
        {mediaUrl && project.media_kind === 'pdf' && <a className="detail-file-link" href={mediaUrl} target="_blank" rel="noreferrer">Proje PDF’ini aç <span aria-hidden="true">↗</span></a>}
        {mediaUrl && project.media_kind === 'video' && <video className="detail-video" src={mediaUrl} controls preload="metadata" aria-label={`${project.title} videosu`} />}
      </section>
      <footer className="detail-footer"><a href="/#isler">← Tüm işlere dön</a><a href="/#iletisim">Bir proje konuşalım</a></footer>
    </main>
  )
}
