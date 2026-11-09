import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { site, type Project } from '../config/site'

type ProjectRow = {
  id: string
  index: string
  category: string
  title: string
  subtitle: string | null
  description: string | null
  tech: string[] | null
  href: string | null
  image: string | null
  colors: string[] | null
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    index: row.index,
    category: row.category,
    title: row.title,
    subtitle: row.subtitle ?? '',
    description: row.description ?? '',
    tech: row.tech ?? [],
    href: row.href ?? '#',
    image: row.image ?? '',
    colors: (row.colors && row.colors.length >= 2 ? row.colors.slice(0, 2) : ['#1c5a6b', '#0a2733']) as [
      string,
      string,
    ],
    motif: 1,
  }
}

/**
 * 优先从 Supabase 读作品；读不到（还没建表 / 网络失败）时回退到 site.ts 的静态数据，
 * 保证网站永远不会白屏。
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => site.projects as unknown as Project[])
  const [source, setSource] = useState<'supabase' | 'local'>('local')

  useEffect(() => {
    let mounted = true
    supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (mounted && !error && data && data.length > 0) {
          setProjects(data.map(rowToProject))
          setSource('supabase')
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return { projects, source }
}
