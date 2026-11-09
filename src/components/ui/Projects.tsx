import { site } from '../../config/site'
import { Reveal } from './Reveal'
import { useProjects } from '../../hooks/useProjects'

export function Projects() {
  const [l1, l2] = site.projectsTitle
  const { projects } = useProjects()

  return (
    <section id="projects" data-section className="section veil">
      <div className="section-inner">
        <div className="section-head">
          <Reveal>
            <div className="kicker">02 — Selected works</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {l1}
              <em>{l2}</em>
            </h2>
          </Reveal>
        </div>

        <div className="project-grid">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <a
                className="project"
                href={p.href}
                target={p.href.startsWith('http') ? '_blank' : undefined}
                rel={p.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                onClick={(e) => {
                  if (p.href === '#') e.preventDefault()
                }}
                aria-label={`${p.title} — ${p.subtitle}`}
              >
                <div
                  className="cover"
                  style={{ ['--c1' as string]: p.colors[0], ['--c2' as string]: p.colors[1] }}
                >
                  <img src={p.image} alt="" loading="lazy" />
                </div>

                <div className="project-meta">
                  <div>
                    <small>
                      {p.index} / {p.category}
                    </small>
                    <h3>
                      {p.title}
                      <span>{p.subtitle}</span>
                    </h3>
                    <div className="tech-row">
                      {p.tech.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <span className="project-arrow" aria-hidden="true">
                    ↗
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
