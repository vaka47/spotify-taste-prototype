"use client";

import { useState } from "react";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { useToast } from "@/components/ToastProvider";
import { privacyControls } from "@/lib/mock-data";

const iconByControl: Record<string, "taste" | "hide" | "clock" | "external" | "privacy"> = {
  share: "taste",
  "hide-track": "hide",
  "hide-artist": "hide",
  delay: "clock",
  selected: "external",
  sponsor: "privacy",
};

export default function PrivacyPage() {
  const [controls, setControls] = useState(privacyControls);
  const { showToast } = useToast();

  function toggle(id: string) {
    setControls(current =>
      current.map(control => {
        if (control.id !== id) return control;
        const next = { ...control, enabled: !control.enabled };
        showToast(`${next.title}: ${next.enabled ? "enabled" : "disabled"}`);
        return next;
      }),
    );
  }

  return (
    <main className="page pageNarrow">
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">Privacy & trust</div>
          <h1 className="pageTitle">Taste only works if the signal feels real.</h1>
          <p className="lead">
            Sharing is opt-in, delayable, hideable and disclosure-aware. These controls are part of the product system,
            not afterthoughts.
          </p>
        </div>
        <DemoBadge>Trust guardrails</DemoBadge>
      </div>

      <section className="privacyGrid section" aria-label="Taste privacy controls">
        {controls.map(control => (
          <article className="privacyRow" key={control.id}>
            <span className="privacyIcon">
              <Icon name={iconByControl[control.id]} />
            </span>
            <div>
              <strong>{control.title}</strong>
              <p className="finePrint">{control.description}</p>
            </div>
            <button
              className={`switch ${control.enabled ? "on" : ""}`}
              type="button"
              role="switch"
              aria-checked={control.enabled}
              aria-label={`${control.title} control`}
              onClick={() => toggle(control.id)}
            >
              <span />
            </button>
          </article>
        ))}
      </section>

      <section className="panel section">
        <div className="sectionHeader">
          <h2>Disclosure principle</h2>
          <DemoBadge>Required trust rule</DemoBadge>
        </div>
        <div className="whyList">
          <div className="whyItem">
            <span className="whyIcon">
              <Icon name="info" />
            </span>
            <span>Paid or promoted Taste placements must be labeled.</span>
          </div>
          <div className="whyItem">
            <span className="whyIcon">
              <Icon name="privacy" />
            </span>
            <span>No public celebrity listening history is implied unless a tastemaker explicitly opts in.</span>
          </div>
          <div className="whyItem">
            <span className="whyIcon">
              <Icon name="hide" />
            </span>
            <span>Hide track, hide artist, delayed activity and selected sessions protect privacy and authenticity.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
