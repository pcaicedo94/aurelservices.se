import React from "react";

// Building blocks for the service pages, so each page is the client's copy
// (content/services/*.js) laid out in the same glass + bento style. The copy
// comes from Textosweb.docx (2026-11-26); keep its wording when editing.
//
// Lists are plain strings. A paragraph list ("paras") renders one <p> each.

const Paras = ({ paras }) =>
  (paras || []).map((text) => (
    <p key={text.slice(0, 40)}>{text}</p>
  ));

const CheckList = ({ items, className = "svc-checklist" }) =>
  items && items.length ? (
    <ul className={className}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : null;

// The opening of a page: the SEO heading, a short subheading and the lead.
export const ServiceIntro = ({ heading, subheading, paras }) => (
  <div className="svc-intro">
    <h2>{heading}</h2>
    {subheading && <p className="svc-subheading">{subheading}</p>}
    <Paras paras={paras} />
  </div>
);

// "Våra tjänster inom …": one glass card per service, two to a row.
export const ServiceSections = ({ title, intro, sections }) => (
  <section className="svc-block" aria-label={title || undefined}>
    {title && <h2 className="svc-block-title">{title}</h2>}
    {intro && <p className="svc-block-intro">{intro}</p>}
    <div className="svc-grid">
      {sections.map((section) => (
        <article key={section.title} className="info-card svc-card">
          <h3>{section.title}</h3>
          <Paras paras={section.paras} />
          {section.listIntro && <p className="svc-list-intro">{section.listIntro}</p>}
          <CheckList items={section.items} />
          <Paras paras={section.outro} />
        </article>
      ))}
    </div>
  </section>
);

// "Vad ingår i vår …?": collapsible groups in two columns, like the layout
// the client pointed at. Native <details> so it works without JavaScript and
// in the static export.
export const IncludedAccordion = ({ title, intro, groups, defaultOpen = false }) => (
  <section className="svc-block">
    <h2 className="svc-block-title">{title}</h2>
    {intro && <p className="svc-block-intro">{intro}</p>}
    <div className="svc-accordion">
      {groups.map((group, index) => (
        <details
          key={group.title}
          className="svc-accordion-item"
          open={defaultOpen && index === 0 ? true : undefined}
        >
          <summary>{group.title}</summary>
          <div className="svc-accordion-body">
            {group.intro && <p>{group.intro}</p>}
            <Paras paras={group.paras} />
            <CheckList items={group.items} />
            {(group.subsections || []).map((sub) => (
              <div key={sub.title} className="svc-subsection">
                {sub.title && <h3>{sub.title}</h3>}
                <Paras paras={sub.paras} />
              </div>
            ))}
            {group.afterTitle && <p className="svc-after-title">{group.afterTitle}</p>}
            <CheckList items={group.afterItems} className="svc-notelist" />
            {(group.notes || []).map((note) => (
              <p key={note.slice(0, 40)} className="svc-note">
                {note}
              </p>
            ))}
          </div>
        </details>
      ))}
    </div>
  </section>
);

// "Bra att veta": the conditions, in a calmer card than the checklists.
export const GoodToKnow = ({ title = "Bra att veta", intro, items, outro }) => (
  <section className="glass-panel svc-good-to-know">
    <h2 className="svc-block-title">{title}</h2>
    {intro && <p>{intro}</p>}
    <CheckList items={items} className="svc-notelist" />
    {outro && <p className="svc-outro">{outro}</p>}
  </section>
);

// "Så fungerar det": numbered steps, one tile each.
export const HowItWorks = ({ title = "Så fungerar det", intro, steps }) => (
  <section className="svc-block">
    <h2 className="svc-block-title">{title}</h2>
    {intro && <p className="svc-block-intro">{intro}</p>}
    <ol className="svc-steps">
      {steps.map((step, index) => (
        <li key={step.title} className="glass-panel svc-step">
          <span className="svc-step-number" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}/
          </span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </li>
      ))}
    </ol>
  </section>
);

// The closing call to action, a green tile with the quote button.
export const QuoteCta = ({ title, paras, buttonLabel = "Begär kostnadsfri offert", onClick }) => (
  <section className="brand-card svc-cta">
    <div>
      <h2>{title}</h2>
      <Paras paras={paras} />
    </div>
    <button type="button" className="default-btn svc-cta-button" onClick={onClick}>
      {buttonLabel}
    </button>
  </section>
);

// A plain titled list in a glass card, for checklists that are not services
// (for example "Förbered bostaden inför flyttstädningen").
export const NumberedTips = ({ title, intro, tips }) => (
  <section className="svc-block">
    <h2 className="svc-block-title">{title}</h2>
    {intro && <p className="svc-block-intro">{intro}</p>}
    <ol className="svc-tips">
      {tips.map((tip) => (
        <li key={tip.title} className="info-card svc-tip">
          <h3>{tip.title}</h3>
          <Paras paras={tip.paras} />
        </li>
      ))}
    </ol>
  </section>
);
