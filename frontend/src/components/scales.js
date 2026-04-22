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
  element.dataset.balance = String(safe);
}

function createScaleSvg() {
  const svg = document.createElementNS(SCALE_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 360 220');
  svg.setAttribute('class', 'decision-scales-svg');
  svg.setAttribute('aria-hidden', 'true');

  svg.innerHTML = `
    <defs>
      <linearGradient id="beamGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#151515"/>
        <stop offset="55%" stop-color="#2f2f2f"/>
        <stop offset="100%" stop-color="#121212"/>
      </linearGradient>
      <linearGradient id="pillarGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a2a2a"/>
        <stop offset="100%" stop-color="#0e0e0e"/>
      </linearGradient>
      <linearGradient id="plateGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffdf6"/>
        <stop offset="100%" stop-color="#ede4d2"/>
      </linearGradient>
    </defs>

    <g class="scales-shadow">
      <ellipse cx="180" cy="192" rx="110" ry="9"></ellipse>
    </g>

    <g class="scales-base">
      <path d="M 160 98 L 200 98 L 207 175 L 153 175 Z" class="pillar"></path>
      <rect x="128" y="176" width="104" height="10" class="foot"></rect>
      <circle cx="180" cy="96" r="7" class="pivot"></circle>
    </g>

    <g class="scales-beam-group">
      <rect x="76" y="74" width="208" height="9" rx="2" class="beam"></rect>
      <circle cx="180" cy="79" r="6" class="beam-cap"></circle>

      <line x1="108" y1="83" x2="108" y2="126" class="rod"></line>
      <line x1="252" y1="83" x2="252" y2="126" class="rod"></line>

      <g class="plate plate-left">
        <path d="M 82 126 L 134 126 L 126 142 L 90 142 Z"></path>
      </g>
      <g class="plate plate-right">
        <path d="M 226 126 L 278 126 L 270 142 L 234 142 Z"></path>
      </g>
    </g>
  `;

  return svg;
}

function animateDamped(widget, from, to, durationMs = 560) {
  const start = performance.now();

  function tick(now) {
    const progress = clamp((now - start) / durationMs, 0, 1);
    const eased = 1 - Math.exp(-5.2 * progress) * Math.cos(8.6 * progress);
    const next = from + (to - from) * clamp(eased, 0, 1.08);
    setBalance(widget, next);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    setBalance(widget, to);
  }

  requestAnimationFrame(tick);
}

export function createScalesWidget({
  mode = 'question',
  balance = 0,
  startBalance,
  intensity = 0,
  leftLabel = 'Против',
  rightLabel = 'За',
  caption = '',
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `decision-scales decision-scales--${mode}`;

  wrapper.innerHTML = `
    <div class="decision-scales-frame">
      <div class="decision-scales-caption"></div>
      <div class="decision-scales-stage"></div>
      <div class="decision-scales-labels">
        <span class="left-label"></span>
        <span class="right-label"></span>
      </div>
    </div>
  `;

  wrapper.querySelector('.decision-scales-caption').textContent = caption;
  wrapper.querySelector('.left-label').textContent = leftLabel;
  wrapper.querySelector('.right-label').textContent = rightLabel;

  const stage = wrapper.querySelector('.decision-scales-stage');
  stage.append(createScaleSvg());

  const safeBalance = clamp(toNumber(balance), -1, 1);
  const initial = typeof startBalance === 'undefined' ? safeBalance : clamp(toNumber(startBalance), -1, 1);

  wrapper.style.setProperty('--scale-intensity', clamp(toNumber(intensity), 0, 1).toFixed(3));
  setBalance(wrapper, initial);

  if (Math.abs(initial - safeBalance) > 0.01) {
    animateDamped(wrapper, initial, safeBalance);
  }

  return {
    element: wrapper,
    update(next = {}) {
      if (typeof next.balance !== 'undefined') {
        const current = toNumber(wrapper.dataset.balance, 0);
        const target = clamp(toNumber(next.balance), -1, 1);
        if (Math.abs(target - current) > 0.02) {
          animateDamped(wrapper, current, target, 360);
        } else {
          setBalance(wrapper, target);
        }
      }

      if (typeof next.intensity !== 'undefined') {
        wrapper.style.setProperty('--scale-intensity', clamp(toNumber(next.intensity), 0, 1).toFixed(3));
      }

      if (typeof next.caption === 'string') {
        const captionElement = wrapper.querySelector('.decision-scales-caption');
        captionElement.textContent = next.caption;
      }
    },
  };
}
