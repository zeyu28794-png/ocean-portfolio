import { site } from '../../config/site'
import { Reveal } from './Reveal'

export function Contact() {
  const [l1, l2, l3] = site.contact.title

  return (
    <section id="contact" data-section className="section contact veil-soft">
      <div className="section-inner">
        <div className="contact-inner">
          <Reveal>
            <div className="kicker">{site.contact.kicker}</div>
          </Reveal>

          <Reveal delay={90}>
            <h2 className="contact-title">
              {l1}
              <br />
              {l2}
              <br />
              <em>{l3}</em>
            </h2>
          </Reveal>

          <Reveal delay={180}>
            <a className="contact-mail" href={`mailto:${site.contact.email}`}>
              {site.contact.email}
              <i aria-hidden="true">↗</i>
            </a>
          </Reveal>

          <Reveal delay={240}>
            <p className="lede" style={{ marginTop: 22, maxWidth: '38ch' }}>
              {site.contact.note}
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="contact-links">
              {site.contact.links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel={l.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                >
                  {l.label === 'GitHub' && (
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                  )}
                  {l.label}
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={360}>
            <p className="lede" style={{ marginTop: 56, opacity: 0.8 }}>
              {site.contact.closing}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
