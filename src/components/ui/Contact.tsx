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
