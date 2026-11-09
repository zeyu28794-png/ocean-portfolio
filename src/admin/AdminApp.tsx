import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type ProjectRow = {
  id: string
  index: string
  category: string
  title: string
  subtitle: string
  description: string
  tech: string[]
  href: string
  image: string
  colors: string[]
  sort_order: number
}

const blank = (): ProjectRow => ({
  id: '',
  index: '',
  category: 'Web App',
  title: '',
  subtitle: '',
  description: '',
  tech: [],
  href: '',
  image: '',
  colors: ['#1c5a6b', '#0a2733'],
  sort_order: 0,
})

export function AdminApp() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [rows, setRows] = useState<ProjectRow[]>([])
  const [editing, setEditing] = useState<ProjectRow>(blank)
  const [editingId, setEditingId] = useState<string | null>(null) // null = 新增
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const refresh = async () => {
    const { data, error } = await supabase.from('projects').select('*').order('sort_order')
    if (!error && data) setRows(data as ProjectRow[])
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authed) return
    let cancelled = false
    supabase
      .from('projects')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setRows(data as ProjectRow[])
      })
    return () => {
      cancelled = true
    }
  }, [authed])

  const signIn = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAuthed(false)
  }

  const startEdit = (row: ProjectRow) => {
    setEditing({ ...row, tech: [...(row.tech || [])], colors: [...(row.colors || [])] })
    setEditingId(row.id)
    setMsg('')
  }

  const startNew = () => {
    setEditing(blank())
    setEditingId(null)
    setMsg('')
  }

  const set = (patch: Partial<ProjectRow>) => setEditing((e) => ({ ...e, ...patch }))

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const id = editingId ?? (editing.id.trim() || crypto.randomUUID())
    const payload = {
      id,
      index: editing.index || '01',
      category: editing.category || 'Web App',
      title: editing.title,
      subtitle: editing.subtitle || '',
      description: editing.description || '',
      tech: editing.tech,
      href: editing.href || '#',
      image: editing.image || '',
      colors: editing.colors,
      sort_order: editing.sort_order,
    }
    const { error } = await supabase.from('projects').upsert(payload)
    setSaving(false)
    if (error) setMsg('保存失败：' + error.message)
    else {
      setMsg('已保存 ✓')
      setEditingId(id)
      refresh()
    }
  }

  const remove = async (row: ProjectRow) => {
    if (!window.confirm(`确定删除「${row.title}」？`)) return
    const { error } = await supabase.from('projects').delete().eq('id', row.id)
    if (error) setMsg('删除失败：' + error.message)
    else {
      if (editingId === row.id) startNew()
      refresh()
    }
  }

  if (!ready) {
    return (
      <div className="wrap">
        <p className="muted">加载中…</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="wrap">
        <form className="card login" onSubmit={signIn}>
          <h1>OCEAN 管理后台</h1>
          <p className="muted">登录后管理作品</p>
          <label>
            邮箱
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>
            密码
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {authError && <p className="err">{authError}</p>}
          <button type="submit">登录</button>
        </form>
      </div>
    )
  }

  return (
    <div className="wrap">
      <header className="top">
        <h1>OCEAN 管理后台</h1>
        <div className="top-actions">
          <button className="ghost" onClick={startNew}>
            + 新增作品
          </button>
          <button className="ghost" onClick={signOut}>
            退出
          </button>
        </div>
      </header>

      <div className="cols">
        <div className="list">
          {rows.map((r) => (
            <div
              key={r.id}
              className={'row' + (editingId === r.id ? ' active' : '')}
              onClick={() => startEdit(r)}
            >
              <span className="idx">{r.index}</span>
              <span className="t">{r.title}</span>
              <span className="cat">{r.category}</span>
              <button
                className="del"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(r)
                }}
              >
                删
              </button>
            </div>
          ))}
          {rows.length === 0 && <p className="muted">暂无作品，点右上角「+ 新增作品」</p>}
        </div>

        <form className="card editor" onSubmit={save}>
          <h2>{editingId ? '编辑作品' : '新增作品'}</h2>

          <label>
            ID（英文标识）
            <input
              value={editing.id}
              disabled={!!editingId}
              onChange={(e) => set({ id: e.target.value })}
              placeholder="my-project"
            />
          </label>

          <div className="grid2">
            <label>
              标题 *
              <input value={editing.title} onChange={(e) => set({ title: e.target.value })} required />
            </label>
            <label>
              副标题
              <input value={editing.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
            </label>
          </div>

          <label>
            类别
            <input value={editing.category} onChange={(e) => set({ category: e.target.value })} />
          </label>

          <label>
            简介
            <textarea rows={3} value={editing.description} onChange={(e) => set({ description: e.target.value })} />
          </label>

          <label>
            链接
            <input value={editing.href} onChange={(e) => set({ href: e.target.value })} placeholder="https://…" />
          </label>

          <label>
            封面图路径
            <input
              value={editing.image}
              onChange={(e) => set({ image: e.target.value })}
              placeholder="covers/xxx.jpg 或 https://…"
            />
          </label>

          <label>
            技术标签（逗号分隔）
            <input
              value={editing.tech.join(', ')}
              onChange={(e) =>
                set({ tech: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
              }
            />
          </label>

          <div className="grid2">
            <label>
              封面主色
              <input
                type="color"
                value={editing.colors[0] || '#1c5a6b'}
                onChange={(e) => set({ colors: [e.target.value, editing.colors[1] || '#0a2733'] })}
              />
            </label>
            <label>
              封面次色
              <input
                type="color"
                value={editing.colors[1] || '#0a2733'}
                onChange={(e) => set({ colors: [editing.colors[0] || '#1c5a6b', e.target.value] })}
              />
            </label>
          </div>

          <div className="grid2">
            <label>
              编号
              <input value={editing.index} onChange={(e) => set({ index: e.target.value })} placeholder="01" />
            </label>
            <label>
              排序
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) => set({ sort_order: Number(e.target.value) })}
              />
            </label>
          </div>

          {msg && <p className={msg.includes('失败') ? 'err' : 'ok'}>{msg}</p>}
          <button type="submit" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </form>
      </div>
    </div>
  )
}
