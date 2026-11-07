import { site } from '../../config/site'
import { Reveal } from './Reveal'

export function Journey() {
  const [l1, l2, l3] = site.journeyTitle

  return (
    <section id="journey" data-section className="section veil">
      <div className="section-inner">
        <div className="journey-grid">
          <div>
            <Reveal>
              <div className="kicker">03 — My journey</div>
              <h2 className="display" style={{ marginTop: 22 }}>
                {l1}
                <br />
                {l2}
                <em>{l3}</em>
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="lede" style={{ marginTop: 26, maxWidth: '30ch' }}>
                {site.journeyIntro}
              </p>
            </Reveal>
          </div>

          <div className="timeline">
            {site.journey.map((e, i) => (
              <Reveal key={e.title} delay={i * 90}>
                <article className="event">
                  <time>{e.time}</time>
                  <h3>{e.title}</h3>
                  <p>{e.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
