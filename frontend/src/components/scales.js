const SCALE_NS = 'http://www.w3.org/2000/svg';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function setBalance(element, nextBalance) {
  const safe = clamp(toNumber(nextBalance), -1, 1);
  element.style.setProperty('--scale-balance', safe.toFixed(3));
  element.setAttribute('data-balance', String(safe));
}

function createScaleSvg() {
  const svg = document.createElementNS(SCALE_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 340 180');
  svg.setAttribute('class', 'decision-scales-svg');
  svg.setAttribute('aria-hidden', 'true');

  svg.innerHTML = `
    <defs>
      <linearGradient id="beamGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#121212" />
        <stop offset="100%" stop-color="#3f3f3f" />
      </linearGradient>
      <linearGradient id="plateGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e9e4d7" />
      </linearGradient>
    </defs>

    <g class="scales-base">
      <rect x="152" y="116" width="36" height="44" rx="2" class="pillar" />
      <rect x="120" y="160" width="100" height="10" class="foot" />
      <circle cx="170" cy="116" r="8" class="pivot" />
    </g>

    <g class="scales-beam-group">
      <rect x="74" y="70" width="192" height="8" rx="1" class="beam" />
      <circle cx="170" cy="74" r="6" class="beam-dot" />

      <line x1="98" y1="77" x2="98" y2="102" class="rod" />
      <line x1="242" y1="77" x2="242" y2="102" class="rod" />

      <g class="plate plate-left">
        <rect x="66" y="102" width="64" height="7" rx="1" />
      </g>
      <g class="plate plate-right">
        <rect x="210" y="102" width="64" height="7" rx="1" />
      </g>
    </g>
  `;

  return svg;
}

function runDampedIntro(container) {
  const group = container.querySelector('.scales-beam-group');
  if (!group) {
    return;
  }

  const startedAt = performance.now();
  const durationMs = 1350;
  const base = toNumber(container.dataset.balance, 0);

  function tick(now) {
    const elapsed = now - startedAt;
    const progress = clamp(elapsed / durationMs, 0, 1);
    const wave = Math.sin(progress * 8.5 * Math.PI) * (1 - progress) * 0.5;
    const next = clamp(base + wave, -1, 1);
    setBalance(container, next);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    setBalance(container, base);
  }

  requestAnimationFrame(tick);
}

export function createScalesWidget({
  mode = 'question',
  balance = 0,
  intensity = 0,
  leftLabel = 'Против',
  rightLabel = 'За',
  caption = '',
  live = false,
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `decision-scales decision-scales--${mode}`;
  wrapper.dataset.mode = mode;

  wrapper.innerHTML = `
    <div class="decision-scales-frame">
      <div class="decision-scales-caption">${caption}</div>
      <div class="decision-scales-stage"></div>
      <div class="decision-scales-labels">
        <span>${leftLabel}</span>
        <span>${rightLabel}</span>
      </div>
    </div>
  `;

  const stage = wrapper.querySelector('.decision-scales-stage');
  stage.append(createScaleSvg());
  wrapper.style.setProperty('--scale-intensity', clamp(toNumber(intensity), 0, 1).toFixed(3));

  setBalance(wrapper, balance);

  if (live) {
    wrapper.classList.add('decision-scales--live');
  }

  if (mode === 'drama') {
    runDampedIntro(wrapper);
  }

  return {
    element: wrapper,
    update(next = {}) {
      if (typeof next.balance !== 'undefined') {
        setBalance(wrapper, next.balance);
      }
      if (typeof next.intensity !== 'undefined') {
        wrapper.style.setProperty('--scale-intensity', clamp(toNumber(next.intensity), 0, 1).toFixed(3));
      }
      if (typeof next.caption === 'string') {
        const captionElement = wrapper.querySelector('.decision-scales-caption');
        if (captionElement) {
          captionElement.textContent = next.caption;
        }
      }
    },
  };
}
