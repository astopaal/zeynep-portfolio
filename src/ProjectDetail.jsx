import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './ProjectDetail.css'

function BrandGallery({ projectTitle, brandName, items }) {
  const [activeImage, setActiveImage] = useState(0)
  const images = items.filter((item) => item.media_kind === 'image')
  const documents = items.filter((item) => item.media_kind === 'pdf')
  const videos = items.filter((item) => item.media_kind === 'video')
  const imageUrl = (item) => supabase.storage.from('portfolio-media').getPublicUrl(item.file_path).data.publicUrl
  const goToImage = (index) => setActiveImage((index + images.length) % images.length)

  return <section className="brand-work" aria-label={`${brandName} çalışmaları`}>
    <div className="brand-work-heading"><p className="eyebrow">Marka / İş grubu</p><h2>{brandName}</h2></div>
    {images.length > 0 && <div className="brand-gallery">
      <div className="gallery-stage" aria-live="polite">
        <img key={images[activeImage].id} src={imageUrl(images[activeImage])} alt={`${projectTitle}, ${brandName} · görsel ${activeImage + 1}`} width="1200" height="1200" loading={activeImage === 0 ? 'eager' : 'lazy'} />
        {images.length > 1 && <><button className="gallery-control gallery-prev" type="button" aria-label="Önceki görsel" onClick={() => goToImage(activeImage - 1)}>‹</button><button className="gallery-control gallery-next" type="button" aria-label="Sonraki görsel" onClick={() => goToImage(activeImage + 1)}>›</button><span className="gallery-count">{String(activeImage + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span></>}
      </div>
      {images.length > 1 && <div className="gallery-thumbnails" role="group" aria-label={`${brandName} görselleri`}>{images.map((item, index) => <button className={`gallery-thumb ${activeImage === index ? 'is-active' : ''}`} key={item.id} type="button" aria-label={`${index + 1}. görseli göster`} aria-pressed={activeImage === index} onClick={() => goToImage(index)}><img src={imageUrl(item)} alt="" width="160" height="110" loading="lazy" /></button>)}</div>}
    </div>}
    {documents.length > 0 && <div className="brand-documents"><p className="eyebrow">Katalog dosyaları</p>{documents.map((item) => <a className="brand-pdf" key={item.id} href={imageUrl(item)} target="_blank" rel="noreferrer"><span>{item.title || 'Katalog PDF’i'}</span><span>PDF’i aç ↗</span></a>)}</div>}
    {videos.map((item) => <video className="detail-video" key={item.id} src={imageUrl(item)} controls preload="metadata" aria-label={`${brandName}: ${item.title || 'video'}`} />)}
    {images.length === 0 && documents.length === 0 && videos.length === 0 && <p className="gallery-empty">Bu marka için henüz görsel veya PDF eklenmemiş.</p>}
  </section>
}

export default function ProjectDetail({ projectId }) {
  const [project, setProject] = useState(null)
  const [gallery, setGallery] = useState([])
  const [state, setState] = useState('loading')

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
  const groupedMedia = gallery.reduce((groups, item) => {
    const brandName = item.brand_name || 'Diğer işler'
    const group = groups.find((entry) => entry.name === brandName)
    if (group) group.items.push(item)
    else groups.push({ name: brandName, items: [item] })
    return groups
  }, [])

  return (
    <main className="project-detail">
      <header className="site-header detail-header"><a className="wordmark" href="/">ZY<span>.</span></a><nav className="main-nav" aria-label="Ana menü"><a href="/#isler">İşler</a><a href="/#hakkimda">Hakkımda</a><a className="nav-contact" href="/#iletisim">İletişim <span aria-hidden="true">↗</span></a></nav></header>
      <section className="detail-intro"><p className="eyebrow">{project.category} · Proje detayı</p><h1>{project.title}</h1><div className="detail-summary"><p>{project.description}</p>{project.external_url && <a className="detail-visit" href={project.external_url} target="_blank" rel="noreferrer">Canlı siteyi ziyaret et <span aria-hidden="true">↗</span></a>}</div></section>
      <section className="detail-gallery" aria-label="Proje galeri ve dosyaları">
        {groupedMedia.length ? groupedMedia.map((group) => <BrandGallery key={group.name} projectTitle={project.title} brandName={group.name} items={group.items} />) : <p className="gallery-empty">Bu projeye henüz marka işi eklenmemiş.</p>}
        {mediaUrl && project.media_kind === 'pdf' && <a className="detail-file-link" href={mediaUrl} target="_blank" rel="noreferrer">Proje PDF’ini aç <span aria-hidden="true">↗</span></a>}
        {mediaUrl && project.media_kind === 'video' && <video className="detail-video" src={mediaUrl} controls preload="metadata" aria-label={`${project.title} videosu`} />}
      </section>
      <footer className="detail-footer"><a href="/#isler">← Tüm işlere dön</a><a href="/#iletisim">Bir proje konuşalım</a></footer>
    </main>
  )
}
