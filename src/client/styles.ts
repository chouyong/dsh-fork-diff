const STYLE_ID = 'dsh-fork-diff-style'
const HOLDERS_ATTRIBUTE = 'dshForkDiffHolders'

export const CSS_PREFIX = 'dsh-fork-diff'

const STYLESHEET = `
.${CSS_PREFIX} {
  display: inline-flex;
  align-items: center;
}
.${CSS_PREFIX}__trigger,
.${CSS_PREFIX}__icon-button,
.${CSS_PREFIX}__command,
.${CSS_PREFIX}__retry,
.${CSS_PREFIX}__segment {
  border: 0;
  font: inherit;
  cursor: pointer;
}
.${CSS_PREFIX}__trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 3px 8px;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #5c6370);
  font-size: 13px;
}
.${CSS_PREFIX}__trigger:hover,
.${CSS_PREFIX}__icon-button:hover,
.${CSS_PREFIX}__command:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12));
  color: var(--dsw-alias-label-primary, #1f2329);
}
.${CSS_PREFIX}__trigger:focus-visible,
.${CSS_PREFIX}__icon-button:focus-visible,
.${CSS_PREFIX}__command:focus-visible,
.${CSS_PREFIX}__retry:focus-visible,
.${CSS_PREFIX}__segment:focus-visible,
.${CSS_PREFIX}__select:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #4d6bfe);
  outline-offset: 2px;
}
.${CSS_PREFIX}__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(20, 23, 29, 0.48);
}
.${CSS_PREFIX}__dialog {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: min(1180px, calc(100vw - 32px));
  height: min(820px, calc(100vh - 32px));
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.24));
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, #ffffff);
  box-shadow: var(--dsw-shadow-lv4, 0 18px 48px rgba(0, 0, 0, 0.24));
  color: var(--dsw-alias-label-primary, #1f2329);
}
.${CSS_PREFIX}__topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 8px 14px 8px 18px;
  border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.16));
}
.${CSS_PREFIX}__title {
  flex: 1 1 auto;
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}
.${CSS_PREFIX}__icon-button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #5c6370);
}
.${CSS_PREFIX}__controls {
  display: grid;
  grid-template-columns: minmax(210px, 1fr) auto;
  align-items: end;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.16));
}
.${CSS_PREFIX}__field {
  display: grid;
  gap: 5px;
  color: var(--dsw-alias-label-secondary, #5c6370);
  font-size: 12px;
}
.${CSS_PREFIX}__select {
  width: 100%;
  min-height: 34px;
  padding: 4px 30px 4px 9px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.28));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2329);
  font: inherit;
  font-size: 13px;
}
.${CSS_PREFIX}__segments {
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  min-width: 176px;
  padding: 2px;
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2, #f2f3f5);
}
.${CSS_PREFIX}__segment {
  min-height: 30px;
  padding: 3px 10px;
  border-radius: 4px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #5c6370);
  font-size: 12px;
}
.${CSS_PREFIX}__segment--active {
  background: var(--dsw-alias-bg-layer-1, #ffffff);
  color: var(--dsw-alias-label-primary, #1f2329);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.${CSS_PREFIX}__content {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
.${CSS_PREFIX}__branches {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  background: var(--dsw-alias-bg-layer-1, #ffffff);
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.22));
}
.${CSS_PREFIX}__branch {
  min-width: 0;
  padding: 12px 18px;
}
.${CSS_PREFIX}__branch + .${CSS_PREFIX}__branch {
  border-left: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.16));
}
.${CSS_PREFIX}__branch-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${CSS_PREFIX}__branch-name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
}
.${CSS_PREFIX}__tag {
  flex: none;
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4d6bfe) 14%, transparent);
  color: var(--dsw-alias-state-business-primary, #4d6bfe);
  font-size: 11px;
}
.${CSS_PREFIX}__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 7px;
  color: var(--dsw-alias-label-tertiary, #8b919b);
  font-size: 11px;
}
.${CSS_PREFIX}__command {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 3px 6px;
  border-radius: 5px;
  background: transparent;
  color: var(--dsw-alias-state-business-primary, #4d6bfe);
  font-size: 12px;
}
.${CSS_PREFIX}__notice {
  padding: 9px 18px;
  border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.16));
  background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #b87900) 9%, transparent);
  color: var(--dsw-alias-label-secondary, #5c6370);
  font-size: 12px;
}
.${CSS_PREFIX}__state {
  display: grid;
  min-height: 240px;
  place-items: center;
  gap: 12px;
  padding: 28px;
  color: var(--dsw-alias-label-secondary, #5c6370);
  text-align: center;
}
.${CSS_PREFIX}__retry {
  min-height: 32px;
  padding: 4px 12px;
  border-radius: 6px;
  background: var(--dsw-alias-state-business-primary, #4d6bfe);
  color: #ffffff;
}
.${CSS_PREFIX}__rows {
  display: grid;
}
.${CSS_PREFIX}__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.14));
}
.${CSS_PREFIX}__row--changed { box-shadow: inset 3px 0 0 #c38200; }
.${CSS_PREFIX}__row--left-only { box-shadow: inset 3px 0 0 #d15252; }
.${CSS_PREFIX}__row--right-only { box-shadow: inset 3px 0 0 #26956f; }
.${CSS_PREFIX}__row-head {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 5px 18px;
  background: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.055));
  color: var(--dsw-alias-label-tertiary, #8b919b);
  font-size: 11px;
}
.${CSS_PREFIX}__row-kind {
  color: var(--dsw-alias-label-secondary, #5c6370);
  font-weight: 600;
}
.${CSS_PREFIX}__cell {
  min-width: 0;
  padding: 12px 18px 16px;
}
.${CSS_PREFIX}__cell + .${CSS_PREFIX}__cell {
  border-left: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.16));
}
.${CSS_PREFIX}__cell--empty {
  display: grid;
  place-items: center;
  min-height: 76px;
  color: var(--dsw-alias-label-tertiary, #8b919b);
}
.${CSS_PREFIX}__cell-title {
  margin-bottom: 7px;
  color: var(--dsw-alias-label-secondary, #5c6370);
  font-size: 12px;
  font-weight: 600;
}
.${CSS_PREFIX}__pre {
  max-height: 300px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
}
.${CSS_PREFIX}__line {
  display: block;
  min-height: 1.55em;
}
.${CSS_PREFIX}__line--removed {
  background: color-mix(in srgb, #d15252 15%, transparent);
}
.${CSS_PREFIX}__line--added {
  background: color-mix(in srgb, #26956f 15%, transparent);
}
@media (max-width: 760px) {
  .${CSS_PREFIX}__backdrop { padding: 0; }
  .${CSS_PREFIX}__dialog {
    width: 100vw;
    height: 100dvh;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }
  .${CSS_PREFIX}__controls {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
  .${CSS_PREFIX}__segments { width: 100%; }
  .${CSS_PREFIX}__branches,
  .${CSS_PREFIX}__row { grid-template-columns: 1fr; }
  .${CSS_PREFIX}__branches { position: static; }
  .${CSS_PREFIX}__branch + .${CSS_PREFIX}__branch,
  .${CSS_PREFIX}__cell + .${CSS_PREFIX}__cell {
    border-left: 0;
    border-top: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.16));
  }
  .${CSS_PREFIX}__row-head { grid-column: 1; }
}
`

export function installStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  let tag = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (tag === null) {
    tag = document.createElement('style')
    tag.id = STYLE_ID
    tag.textContent = STYLESHEET
    tag.dataset[HOLDERS_ATTRIBUTE] = '0'
    document.head.append(tag)
  }
  tag.dataset[HOLDERS_ATTRIBUTE] = String(holdersOf(tag) + 1)

  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    const live = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (live === null) return
    const remaining = holdersOf(live) - 1
    if (remaining > 0) live.dataset[HOLDERS_ATTRIBUTE] = String(remaining)
    else live.remove()
  }
}

function holdersOf(tag: HTMLStyleElement): number {
  const parsed = Number.parseInt(tag.dataset[HOLDERS_ATTRIBUTE] ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1
}
