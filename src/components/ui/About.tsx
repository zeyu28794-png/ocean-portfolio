import { site } from '../../config/site'
import { Reveal } from './Reveal'

export function About() {
  const [l1, l2, l3] = site.about.title

  return (
    <section id="about" data-section className="section veil">
      <div className="section-inner">
        <div className="about-grid">
          <div>
            <Reveal>
              <div className="kicker">{site.about.kicker}</div>
            </Reveal>

            <Reveal delay={90}>
              <h2 className="display" style={{ marginTop: 26 }}>
                {l1}
                <br />
                {l2}
                <em>{l3}</em>
              </h2>
            </Reveal>

            <Reveal delay={200}>
              <div className="avatar-note">
                <span className="avatar-mark" aria-hidden="true">
                  {site.initials}
                </span>
                {site.about.note}
              </div>
            </Reveal>
          </div>

          <div>
            <Reveal delay={140}>
              <p className="about-quote">{site.about.quote}</p>
            </Reveal>

            <Reveal delay={220}>
              <div className="about-copy lede">
                {site.about.paragraphs.map((p) => (
                  <p key={p.slice(0, 12)}>{p}</p>
                ))}
              </div>
            </Reveal>

            <Reveal delay={300}>
              <div className="cap-list">
                <div className="kicker">{site.capabilitiesTitle}</div>
                {site.capabilities.map((c, i) => (
                  <div className="cap-row" key={c.name}>
                    <em>{String(i + 1).padStart(2, '0')}</em>
                    <h3>{c.name}</h3>
                    <p>{c.detail}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
