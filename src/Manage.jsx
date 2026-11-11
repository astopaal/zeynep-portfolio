import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './Manage.css'

const blankProject = { title: '', category: 'Grafik tasarım', description: '', media_kind: 'image', external_url: '', published: true }
const categories = ['Grafik tasarım', 'Ambalaj', 'Sosyal medya', 'Marka kimliği', 'Web tasarımı', 'UI/UX tasarımı', 'Reklam tasarımı', 'Video / motion']
const newMediaBatch = () => ({ id: crypto.randomUUID(), brandName: '', files: [] })

export default function Manage() {
  const [session, setSession] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(blankProject)
  const [mediaBatches, setMediaBatches] = useState(() => [newMediaBatch()])
  const [existingMedia, setExistingMedia] = useState([])
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    document.title = 'Yönetim paneli | Zeynep Yılmaz'
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview('')
      return
    }
    const previewUrl = URL.createObjectURL(coverFile)
    setCoverPreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [coverFile])

  useEffect(() => {
    let active = true
    async function checkAccess() {
      if (!session || !supabase) {
        setAuthorized(false)
        setProjects([])
        return
      }
      const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle()
      if (!active) return
      if (error || !data) {
        setAuthorized(false)
        setNotice('Bu hesap yönetim paneline yetkili değil.')
        return
      }
      setAuthorized(true)
      setNotice('')
      const { data: rows, error: projectsError } = await supabase.from('portfolio_projects').select('*').order('sort_order').order('created_at', { ascending: false })
      if (projectsError) setNotice(projectsError.message)
      else setProjects(rows || [])
    }
    checkAccess()
    return () => { active = false }
  }, [session])

  async function signIn(event) {
    event.preventDefault()
    if (!supabase) return setNotice('Supabase bağlantısı bulunamadı. .env.local dosyasını kontrol et.')
    setBusy(true)
    setNotice('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setNotice('Giriş başarısız. E-posta ve parolayı kontrol et.')
  }

  async function editProject(project) {
    setStep(1)
    setEditingId(project.id)
    setForm({ title: project.title, category: project.category, description: project.description || '', media_kind: project.media_kind, external_url: project.external_url || '', published: project.published })
    setMediaBatches([newMediaBatch()])
    const { data } = await supabase.from('portfolio_project_media').select('*').eq('project_id', project.id).order('sort_order')
    setExistingMedia(data || [])
    setCoverFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pasteCover(event) {
    event.preventDefault()
    const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith('image/'))
    if (!imageItem) {
      setNotice('Panoda görsel bulunamadı. Bir görsel kopyalayıp tekrar dene.')
      return
    }
    const pastedImage = imageItem.getAsFile()
    if (!pastedImage) {
      setNotice('Panodaki görsel alınamadı. Dosya seçerek eklemeyi dene.')
      return
    }
    const extension = pastedImage.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
    setCoverFile(new File([pastedImage], `kapak-${Date.now()}.${extension}`, { type: pastedImage.type }))
    setNotice('Kapak görseli panodan alındı. Kaydedince projeye eklenecek.')
  }

  async function saveProject(event) {
    event.preventDefault()
    setBusy(true)
    setNotice('')
    const currentProject = projects.find((project) => project.id === editingId)
    let mediaPath = currentProject?.media_path || null
    let coverPath = currentProject?.cover_path || null
    if (coverFile) {
      const safeName = coverFile.name.normalize('NFKD').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()
      const path = `covers/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('portfolio-media').upload(path, coverFile, { upsert: false })
      if (uploadError) {
        setBusy(false)
        setNotice(uploadError.message)
        return
      }
      coverPath = path
    }
    if (!coverPath) {
      setBusy(false)
      setNotice('Her proje için bir kapak görseli eklemelisin.')
      return
    }
    const values = { ...form, media_path: mediaPath, cover_path: coverPath, sort_order: currentProject?.sort_order ?? projects.length }
    const query = editingId
      ? supabase.from('portfolio_projects').update(values).eq('id', editingId).select().single()
      : supabase.from('portfolio_projects').insert(values).select().single()
    const { data: savedProject, error } = await query
    if (error) {
      setBusy(false)
      return setNotice(error.message)
    }
    const mediaEntries = mediaBatches.flatMap((batch) => batch.files.map((batchFile) => ({ batch, batchFile })))
    if (mediaEntries.length) {
      const uploaded = await Promise.all(mediaEntries.map(async ({ batch, batchFile }, index) => {
        const safeName = batchFile.name.normalize('NFKD').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()
        const path = `projects/${savedProject.id}/${crypto.randomUUID()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from('portfolio-media').upload(path, batchFile, { upsert: false })
        if (uploadError) return { error: uploadError }
        const mediaKind = batchFile.type === 'application/pdf' ? 'pdf' : batchFile.type.startsWith('video/') ? 'video' : 'image'
        const { error: insertError } = await supabase.from('portfolio_project_media').insert({ project_id: savedProject.id, file_path: path, sort_order: existingMedia.length + index, brand_name: batch.brandName.trim(), media_kind: mediaKind, title: batchFile.name.replace(/\.[^.]+$/, '') })
        return { error: insertError }
      }))
      const galleryError = uploaded.find((result) => result.error)?.error
      if (galleryError) {
        setBusy(false)
        return setNotice(`Proje kaydedildi ancak galeri görsellerinin bir kısmı eklenemedi: ${galleryError.message}`)
      }
    }
    setBusy(false)
    setForm(blankProject)
    setMediaBatches([newMediaBatch()])
    setExistingMedia([])
    setCoverFile(null)
    setEditingId(null)
    setNotice('Proje kaydedildi.')
    const { data } = await supabase.from('portfolio_projects').select('*').order('sort_order').order('created_at', { ascending: false })
    setProjects(data || [])
  }

  function continueStep(event) {
    event.preventDefault()
    if (step === 1 && !form.title.trim()) {
      setNotice('Devam etmek için proje adını yaz.')
      document.getElementById('project-title')?.focus()
      return
    }
    if (step === 2 && !coverFile && !projects.find((project) => project.id === editingId)?.cover_path) {
      setNotice('Devam etmek için bir kapak görseli ekle.')
      return
    }
    if (step === 2 && mediaBatches.some((batch) => batch.files.length && !batch.brandName.trim())) {
      setNotice('Dosyaları eklediğin her gruba marka veya iş adı yaz.')
      return
    }
    setNotice('')
    setStep((current) => Math.min(3, current + 1))
  }

  async function removeProject(project) {
    if (!window.confirm(`“${project.title}” projesi silinsin mi?`)) return
    const { data: gallery } = await supabase.from('portfolio_project_media').select('file_path').eq('project_id', project.id)
    const { error } = await supabase.from('portfolio_projects').delete().eq('id', project.id)
    if (error) return setNotice(error.message)
    const filesToRemove = [project.media_path, project.cover_path].filter(Boolean)
    const allFiles = [...filesToRemove, ...(gallery || []).map((item) => item.file_path)]
    if (allFiles.length) await supabase.storage.from('portfolio-media').remove(allFiles)
    setProjects((current) => current.filter((item) => item.id !== project.id))
    setNotice('Proje silindi.')
  }

  async function removeProjectMedia(item) {
    const { error } = await supabase.from('portfolio_project_media').delete().eq('id', item.id)
    if (error) return setNotice(error.message)
    await supabase.storage.from('portfolio-media').remove([item.file_path])
    setExistingMedia((current) => current.filter((media) => media.id !== item.id))
    setNotice('Dosya galeriden kaldırıldı.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setAuthorized(false)
  }

  if (!supabase) return <main className="manage-shell"><p>Supabase ayarları bulunamadı. `.env.local` dosyasını kontrol et.</p></main>

  if (!session || !authorized) return (
    <main className="manage-shell">
      <a className="manage-back" href="/">← Portfolyoya dön</a>
      <form className="login-panel" onSubmit={signIn}>
        <p className="eyebrow">Zeynep Yılmaz / Yönetim</p>
        <h1>Tekrar merhaba.</h1>
        <p className="manage-copy">Portfolyo içeriklerini düzenlemek için giriş yap.</p>
        <label htmlFor="admin-email">E-posta</label>
        <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="admin-password">Parola</label>
        <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        {notice && <p className="manage-notice" role="status">{notice}</p>}
        <button className="manage-button" type="submit" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
      </form>
    </main>
  )

  return (
    <main className="manage-shell manage-dashboard">
      <header className="manage-top"><div><a className="manage-back" href="/">← Portfolyoya dön</a><p className="eyebrow">Zeynep Yılmaz / Yönetim</p></div><button className="manage-secondary" onClick={signOut}>Oturumu kapat</button></header>
      <div className="manage-title"><div><p className="eyebrow">İçerik yönetimi</p><h1>Portfolyo işleri</h1></div><span>{projects.length} proje</span></div>
      <div className="manage-columns">
        <form className="project-form" onSubmit={step === 3 ? saveProject : continueStep}>
          <div className="form-heading"><span className="form-step">{editingId ? 'PROJEYİ DÜZENLE' : 'YENİ PROJE'}</span><h2>{editingId ? 'Projeyi düzenle' : 'Portfolyoya iş ekle'}</h2><p>Üç kısa adımda çalışmanı yayına hazırla.</p></div>
          <ol className="project-stepper" aria-label="Proje ekleme adımları">{['Proje bilgileri', 'Görsel ve içerik', 'Kontrol ve yayın'].map((title, index) => <li className={step === index + 1 ? 'is-current' : step > index + 1 ? 'is-complete' : ''} key={title}><span className="step-number">{index + 1}</span><strong>{title}</strong></li>)}</ol>
          {step === 1 && <>
          <div className="form-fields">
          <label htmlFor="project-title">Proje adı</label><input id="project-title" required maxLength="100" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <label htmlFor="project-category">Kategori</label><select id="project-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
          <label htmlFor="project-description">Açıklama</label><textarea id="project-description" rows="4" maxLength="1000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          </>}
          {step === 2 && <>
          <div className="media-fields">
            <div className="form-heading"><span className="form-step">02 / GÖRSEL VE BAĞLANTI</span><h2>Kapak ve içerik</h2><p>Kapak görseli, proje kartının arka planında görünecek.</p></div>
          <label htmlFor="project-kind">İçerik türü</label><select id="project-kind" value={form.media_kind} onChange={(event) => setForm({ ...form, media_kind: event.target.value })}><option value="image">Görsel</option><option value="video">Video</option><option value="pdf">PDF</option><option value="link">Bağlantı</option></select>
          <label htmlFor="project-cover-paste">Kapak görseli <span>Her proje için gerekli</span></label>
          <div className="cover-upload">
            <div className="paste-zone" tabIndex="0" onPaste={pasteCover} aria-describedby="cover-help">
              <span className="upload-symbol" aria-hidden="true">＋</span>
              <strong>Görseli buraya yapıştır</strong>
              <span>Ctrl+V kullan veya aşağıdan dosya seç</span>
              <input id="project-cover-paste" className="paste-capture" type="text" aria-label="Görseli yapıştırmak için bu alana odaklan" />
            </div>
            <label className="file-picker" htmlFor="project-cover">Kapak dosyası seç</label>
            <input className="native-file-input" id="project-cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required={!editingId && !coverFile} onChange={(event) => { setCoverFile(event.target.files?.[0] || null); setNotice('') }} />
            {coverPreview && <div className="selected-file"><img className="cover-preview" src={coverPreview} alt="Seçilen kapak görselinin önizlemesi" /><span>{coverFile?.name || 'Kapak görseli hazır'}</span><button type="button" className="file-remove" onClick={() => setCoverFile(null)} aria-label="Yeni kapak seçimini kaldır">Kaldır</button></div>}
            {!coverPreview && editingId && projects.find((project) => project.id === editingId)?.cover_path && <img className="cover-preview" src={supabase.storage.from('portfolio-media').getPublicUrl(projects.find((project) => project.id === editingId).cover_path).data.publicUrl} alt="Mevcut kapak görseli" />}
            <p className="field-help" id="cover-help">JPG, PNG, WebP veya GIF. Dosyalar en fazla 50 MB olabilir.</p>
          </div>
          <div className="media-batches-heading"><div><label>Marka ve dosyalar</label><p className="field-help">Her marka için bir grup oluştur. Fotoğraf ve PDF’leri aynı gruba topluca ekleyebilirsin.</p></div><button className="manage-secondary" type="button" onClick={() => setMediaBatches((current) => [...current, newMediaBatch()])}>Marka grubu ekle</button></div>
          {mediaBatches.map((batch, index) => <fieldset className="media-batch" key={batch.id}><legend>Grup {index + 1}</legend><label htmlFor={`brand-name-${batch.id}`}>Marka / iş adı</label><input id={`brand-name-${batch.id}`} required={batch.files.length > 0} value={batch.brandName} placeholder="Ör. Marka adı" onChange={(event) => setMediaBatches((current) => current.map((item) => item.id === batch.id ? { ...item, brandName: event.target.value } : item))} /><label htmlFor={`media-files-${batch.id}`}>Fotoğraf ve dosyalar</label><input id={`media-files-${batch.id}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm" multiple onChange={(event) => setMediaBatches((current) => current.map((item) => item.id === batch.id ? { ...item, files: Array.from(event.target.files || []) } : item))} /><p className="field-help">{batch.files.length ? `${batch.files.length} dosya: ${batch.files.map((item) => item.name).join(', ')}` : 'JPG, PNG, WebP, PDF veya MP4 seç. Birden fazla dosya seçebilirsin.'}</p>{mediaBatches.length > 1 && <button className="file-remove" type="button" onClick={() => setMediaBatches((current) => current.filter((item) => item.id !== batch.id))}>Bu grubu kaldır</button>}</fieldset>)}
          {existingMedia.length > 0 && <div className="existing-media"><p className="eyebrow">Mevcut proje dosyaları</p>{existingMedia.map((item) => <div className="existing-media-row" key={item.id}><span>{item.brand_name} · {item.title || item.media_kind.toUpperCase()}</span><button className="file-remove" type="button" onClick={() => removeProjectMedia(item)}>Kaldır</button></div>)}</div>}
          <label htmlFor="project-url">Dış bağlantı <span>(web sitesi veya Instagram)</span></label><input id="project-url" type="url" placeholder="https://" value={form.external_url} onChange={(event) => setForm({ ...form, external_url: event.target.value })} />
          </div>
          </>}
          {step === 3 && <section className="project-review"><p className="form-step">SON ADIM</p><h3>Yayın öncesi kontrol</h3><p><strong>Proje:</strong> {form.title || 'İsimsiz proje'}</p><p><strong>Kategori:</strong> {form.category}</p><p><strong>Kapak:</strong> {coverFile?.name || (editingId ? 'Mevcut görsel' : 'Eksik')}</p><p><strong>Yeni marka grupları:</strong> {mediaBatches.filter((batch) => batch.files.length).map((batch) => `${batch.brandName} (${batch.files.length})`).join(', ') || 'Dosya eklenmedi'}</p><label className="publish-check"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Portfolyoda yayımla</label></section>}
          {notice && <p className="manage-notice" role="status">{notice}</p>}
          <div className="form-actions">{step > 1 && <button className="manage-secondary" type="button" onClick={() => { setNotice(''); setStep((current) => current - 1) }}>Geri</button>}{step < 3 ? <button className="manage-button" type="submit">Devam et</button> : <button className="manage-button" type="submit" disabled={busy}>{busy ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri kaydet' : 'Projeyi kaydet'}</button>}</div>
        </form>
        <section className="project-list" aria-labelledby="project-list-title"><h2 id="project-list-title">Eklenen projeler</h2>{projects.length === 0 ? <p className="manage-empty">Henüz proje yok. İlk çalışmanı soldaki formdan ekleyebilirsin.</p> : projects.map((project) => <article className="project-row" key={project.id}><div><h3>{project.title}</h3><p>{project.category} · {project.published ? 'Yayında' : 'Taslak'}</p></div><div className="row-actions"><button className="manage-secondary" onClick={() => editProject(project)}>Düzenle</button><button className="manage-delete" onClick={() => removeProject(project)}>Sil</button></div></article>)}</section>
      </div>
    </main>
  )
}
