import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './ProjectDetail.css'

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

  return (
    <main className="project-detail">
      <header className="detail-header"><a className="wordmark" href="/">ZY<span>.</span></a><a className="detail-back" href="/#isler">← Tüm işler</a></header>
      <section className="detail-intro"><p className="eyebrow">{project.category} / Proje detayı</p><h1>{project.title}</h1><div className="detail-summary"><p>{project.description}</p>{project.external_url && <a className="detail-visit" href={project.external_url} target="_blank" rel="noreferrer">Canlı siteyi ziyaret et <span aria-hidden="true">↗</span></a>}</div></section>
      {coverUrl && <img className="detail-cover" src={coverUrl} alt={`${project.title} kapak görseli`} width="1440" height="960" fetchPriority="high" />}
      <section className="detail-gallery" aria-label="Proje görselleri">
        {gallery.length ? gallery.map((item, index) => {
          const imageUrl = supabase.storage.from('portfolio-media').getPublicUrl(item.file_path).data.publicUrl
          return <figure className="gallery-image" key={item.id}><img src={imageUrl} alt={`${project.title} ekran görüntüsü ${index + 1}`} width="1200" height="900" loading="lazy" /></figure>
        }) : <p className="gallery-empty">Proje görselleri yakında eklenecek.</p>}
        {mediaUrl && project.media_kind === 'pdf' && <a className="detail-file-link" href={mediaUrl} target="_blank" rel="noreferrer">Proje PDF’ini aç <span aria-hidden="true">↗</span></a>}
        {mediaUrl && project.media_kind === 'video' && <video className="detail-video" src={mediaUrl} controls preload="metadata" aria-label={`${project.title} videosu`} />}
      </section>
      <footer className="detail-footer"><a href="/#isler">← Tüm işlere dön</a><a href="/#iletisim">Bir proje konuşalım</a></footer>
    </main>
  )
}
