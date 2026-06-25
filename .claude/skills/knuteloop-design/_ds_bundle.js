/* @ds-bundle: {"format":3,"namespace":"KnuteloopDesignSystem_89dd9e","components":[{"name":"KnoteIcon","sourcePath":"components/brand/KnoteIcon.jsx"},{"name":"KnoteLogo","sourcePath":"components/brand/KnoteLogo.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"StatTile","sourcePath":"components/core/StatTile.jsx"},{"name":"StickerCard","sourcePath":"components/core/StickerCard.jsx"},{"name":"BadgeMedallion","sourcePath":"components/knuter/BadgeMedallion.jsx"},{"name":"KnuteCard","sourcePath":"components/knuter/KnuteCard.jsx"},{"name":"LeaderRow","sourcePath":"components/knuter/LeaderRow.jsx"}],"sourceHashes":{"components/brand/KnoteIcon.jsx":"444ca98ef0a6","components/brand/KnoteLogo.jsx":"0bac8a0b149f","components/core/Avatar.jsx":"972a1e66ac50","components/core/Button.jsx":"1580015952b9","components/core/Chip.jsx":"0c254d30a0aa","components/core/ProgressBar.jsx":"c91cc93c1586","components/core/StatTile.jsx":"5b5ad23bfe39","components/core/StickerCard.jsx":"0291485886e8","components/knuter/BadgeMedallion.jsx":"0884268d4016","components/knuter/KnuteCard.jsx":"9641a80571c4","components/knuter/LeaderRow.jsx":"e453e2b2f032","ui_kits/knutebibliotek/app.jsx":"04e23535734c","ui_kits/knutebibliotek/data.js":"515e8fa54934","ui_kits/knuteloop-app/app.jsx":"e57af3f36396","ui_kits/knuteloop-app/data.js":"03d8e4022104","ui_kits/knuteloop-app/icons.jsx":"b3bf7a749da7","ui_kits/knuteloop-app/screens-flow.jsx":"eaf30b6b591d","ui_kits/knuteloop-app/screens-main.jsx":"874aad0f9591"},"inlinedExternals":[],"unexposedExports":[{"name":"getLeaderboardTitle","sourcePath":"components/knuter/LeaderRow.jsx"}]} */

(() => {

const __ds_ns = (window.KnuteloopDesignSystem_89dd9e = window.KnuteloopDesignSystem_89dd9e || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/KnoteIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * KnoteIcon — Knuteloop's custom hand-drawn knot & category glyphs.
 * Single component, `name` selects the glyph. Stroke inherits `currentColor`,
 * so size + color come from the parent (font-size / color or the `size` prop).
 */
const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};
function KnoteIcon({
  name = 'knute',
  size = 24,
  strokeWidth = 1.8,
  ...rest
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    ...rest
  };
  switch (name) {
    case 'generelle':
      // simple double-loop knot
      return /*#__PURE__*/React.createElement("svg", _extends({}, common, STROKE, {
        strokeWidth: strokeWidth
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 3 12 H 7.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 16.5 12 H 21"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 7.5 12 C 7.5 7.8, 13.5 7.8, 13.5 12 C 13.5 16.2, 7.5 16.2, 7.5 12 Z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 10.5 12 C 10.5 8, 16.5 8, 16.5 12 C 16.5 16, 10.5 16, 10.5 12 Z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 9.5 10.2 L 14.5 13.8"
      }));
    case 'dobbel':
      // double knot — 2x
      return /*#__PURE__*/React.createElement("svg", _extends({}, common, {
        fill: "currentColor",
        "aria-hidden": "true"
      }), /*#__PURE__*/React.createElement("text", {
        x: "12",
        y: "16.8",
        textAnchor: "middle",
        fontSize: "13.6",
        fontWeight: "800",
        fontFamily: "inherit"
      }, "2x"));
    case 'alkohol':
      // beer bottle
      return /*#__PURE__*/React.createElement("svg", _extends({}, common, STROKE, {
        strokeWidth: strokeWidth
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 6.4 8.4 H 15.8 V 20.3 H 6.4 Z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 15.8 10.5 H 17.6 C 19 10.5, 20 11.6, 20 13.1 V 15.2 C 20 16.8, 19 17.9, 17.6 17.9 H 15.8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 6.3 8.5 C 5.4 7.4, 6 5.8, 7.5 5.8 C 7.8 4.3, 10 4.1, 10.7 5.5 C 11.4 4, 13.6 4.2, 13.9 5.8 C 15.4 5.8, 16 7.4, 15.6 8.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 8.4 11.2 V 18.3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 11.1 11.2 V 18.3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 13.8 11.2 V 18.3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 6.4 12.4 C 7.9 11.4, 9.6 13.2, 11.1 12.4 C 12.7 11.4, 14.2 13.2, 15.8 12.4"
      }));
    case 'sex':
      // intersecting gender symbols
      return /*#__PURE__*/React.createElement("svg", _extends({}, common, STROKE, {
        strokeWidth: strokeWidth
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "9",
        cy: "14",
        r: "3.45"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 9 17.45 V 21"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 6.6 19.25 H 11.4"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "15",
        cy: "8.8",
        r: "3.45"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 17.45 6.35 L 20.8 3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 17.8 3 H 20.8 V 6"
      }));
    case 'fordervett':
      // mischief / "rampestreker" mask
      return /*#__PURE__*/React.createElement("svg", _extends({}, common, STROKE, {
        strokeWidth: strokeWidth
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 4 4.2 L 9.2 6.8 C 11 5.9, 13 5.9, 14.8 6.8 L 20 4.2 L 18.2 11.2 C 18.8 12.4, 19 13.6, 18.7 14.9 C 18 18.4, 15 20.5, 12 20.5 C 9 20.5, 6 18.4, 5.3 14.9 C 5 13.6, 5.2 12.4, 5.8 11.2 Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "9.2",
        cy: "12.2",
        r: "0.9",
        fill: "currentColor",
        stroke: "none"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "14.8",
        cy: "12.2",
        r: "0.9",
        fill: "currentColor",
        stroke: "none"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 11 15.3 L 12 16.1 L 13 15.3"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 12 16.1 V 17.3"
      }));
    case 'knute': // brand loop knot (default)
    default:
      return /*#__PURE__*/React.createElement("svg", _extends({
        width: size,
        height: Math.round(size * 56 / 100),
        viewBox: "0 0 100 56",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "11",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true"
      }, rest), /*#__PURE__*/React.createElement("path", {
        d: "M 38,28 C 44,38 56,40 66,34 L 100,28"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M 0,28 C 16,28 20,12 32,8 C 44,4 60,6 68,18 C 76,30 70,46 56,50 C 42,54 28,46 28,36 C 28,24 36,16 46,16 C 56,16 64,22 66,28"
      }));
  }
}
Object.assign(__ds_scope, { KnoteIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/KnoteIcon.jsx", error: String((e && e.message) || e) }); }

// components/brand/KnoteLogo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * KnoteLogo — the Knuteloop lockup: the loop knot mark + "Knuteloop" wordmark
 * in the display face. `variant` controls layout; `tone` the color treatment.
 */
function KnoteLogo({
  variant = 'full',
  tone = 'ink',
  size = 28,
  ...rest
}) {
  const color = tone === 'inverse' ? 'var(--text-inverse)' : tone === 'primary' ? 'var(--primary)' : 'var(--foreground)';
  const markColor = tone === 'inverse' ? 'var(--accent)' : 'var(--primary)';
  const mark = /*#__PURE__*/React.createElement("span", {
    style: {
      color: markColor,
      display: 'inline-flex'
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(__ds_scope.KnoteIcon, {
    name: "knute",
    size: size * 1.7
  }));
  if (variant === 'mark') {
    return /*#__PURE__*/React.createElement("span", _extends({
      role: "img",
      "aria-label": "Knuteloop"
    }, rest), mark);
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": "Knuteloop",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.4,
      ...(rest.style || {})
    }
  }, rest), mark, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      letterSpacing: 'var(--tracking-display)',
      fontSize: size,
      lineHeight: 1,
      color
    }
  }, "Knuteloop"));
}
Object.assign(__ds_scope, { KnoteLogo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/KnoteLogo.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const GRADIENTS = [['#ff7b6b', '#ff4f7a'], ['#7f5cff', '#5e8bff'], ['#1f9d8b', '#0f6a7a'], ['#ff9966', '#ff5e62'], ['#f15bb5', '#9b5de5'], ['#2f80ed', '#56ccf2']];
function hashIndex(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = h * 31 + str.charCodeAt(i) >>> 0;
  return h % GRADIENTS.length;
}

/**
 * Avatar — a russ's avatar. Photo if `src`, else initials on a deterministic
 * gradient. Optional `ring` colored by russType (rødruss / blåruss).
 */
function Avatar({
  name = '',
  src,
  size = 48,
  ring = 'none',
  square = false,
  style,
  ...rest
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const [c1, c2] = GRADIENTS[hashIndex(name)];
  const ringColor = ring === 'red' ? 'var(--russ-red)' : ring === 'blue' ? 'var(--primary)' : ring === 'accent' ? 'var(--accent)' : null;
  const radius = square ? 'var(--radius-md)' : 'var(--radius-full)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: radius,
      background: src ? 'var(--surface-media)' : `linear-gradient(140deg, ${c1}, ${c2})`,
      color: '#fff',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: size * 0.4,
      letterSpacing: '-0.02em',
      overflow: 'hidden',
      border: ringColor ? `2.5px solid ${ringColor}` : 'var(--border-sticker)',
      boxShadow: ringColor ? `0 0 0 2px var(--card), 0 0 0 4px ${ringColor}` : 'none',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — Knuteloop's primary action. Pill-shaped, sticker treatment
 * (2px ink border + hard offset shadow) on the bordered variants.
 */
function Button({
  children,
  variant = 'primary',
  size = 'base',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: 'var(--text-sm)',
      minHeight: 40,
      gap: 6
    },
    base: {
      padding: '12px 22px',
      fontSize: 'var(--text-base)',
      minHeight: 'var(--tap-size)',
      gap: 8
    },
    lg: {
      padding: '16px 30px',
      fontSize: 'var(--text-lg)',
      minHeight: 58,
      gap: 10
    }
  };
  const variants = {
    primary: {
      background: 'var(--primary)',
      color: 'var(--text-inverse)',
      border: 'var(--border-sticker)',
      boxShadow: 'var(--shadow-sticker)'
    },
    accent: {
      background: 'var(--accent)',
      color: 'var(--accent-foreground)',
      border: 'var(--border-sticker)',
      boxShadow: 'var(--shadow-sticker)',
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      fontFamily: 'var(--font-display)'
    },
    secondary: {
      background: 'var(--card)',
      color: 'var(--foreground)',
      border: 'var(--border-sticker)',
      boxShadow: 'var(--shadow-sticker)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-soft)',
      border: '2px solid transparent',
      boxShadow: 'none'
    },
    destructive: {
      background: 'var(--danger)',
      color: '#fff',
      border: '2px solid var(--danger-strong)',
      boxShadow: 'var(--shadow-sticker)'
    }
  };
  const isSticker = ['primary', 'accent', 'secondary', 'destructive'].includes(variant);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled || loading,
    className: isSticker ? 'sticker' : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...sizes[size],
      ...variants[variant],
      width: fullWidth ? '100%' : undefined,
      borderRadius: 'var(--radius-full)',
      fontWeight: variant === 'accent' ? 800 : 700,
      fontFamily: variants[variant].fontFamily || 'var(--font-sans)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(Spinner, null) : iconLeft, children, !loading && iconRight);
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: '50%',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      display: 'inline-block',
      animation: 'knl-spin 0.7s linear infinite'
    }
  }, /*#__PURE__*/React.createElement("style", null, '@keyframes knl-spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Chip — small pill label for category, difficulty, points, or status.
 * `tone` maps to the semantic palette. Optional leading icon.
 */
function Chip({
  children,
  tone = 'neutral',
  size = 'base',
  icon,
  outline = false,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      bg: 'var(--surface-soft)',
      fg: 'var(--text-soft)',
      bd: 'var(--line)'
    },
    primary: {
      bg: 'var(--primary-bg)',
      fg: 'var(--primary-strong)',
      bd: 'color-mix(in srgb, var(--primary) 30%, transparent)'
    },
    accent: {
      bg: 'var(--accent-bg)',
      fg: 'var(--accent-strong)',
      bd: 'var(--accent-border)'
    },
    success: {
      bg: 'var(--success-bg)',
      fg: 'var(--success)',
      bd: 'color-mix(in srgb, var(--success) 32%, transparent)'
    },
    warning: {
      bg: 'var(--warning-bg)',
      fg: 'color-mix(in srgb, var(--warning) 60%, var(--foreground))',
      bd: 'color-mix(in srgb, var(--warning) 36%, transparent)'
    },
    danger: {
      bg: 'var(--danger-bg)',
      fg: 'var(--danger-strong)',
      bd: 'color-mix(in srgb, var(--danger) 32%, transparent)'
    }
  };
  const t = tones[tone] || tones.neutral;
  const sizes = {
    sm: {
      padding: '3px 9px',
      fontSize: '0.72rem',
      gap: 4
    },
    base: {
      padding: '5px 12px',
      fontSize: 'var(--text-xs)',
      gap: 5
    },
    lg: {
      padding: '7px 15px',
      fontSize: 'var(--text-sm)',
      gap: 6
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      ...sizes[size],
      borderRadius: 'var(--radius-full)',
      background: outline ? 'transparent' : t.bg,
      color: t.fg,
      border: `1.5px solid ${t.bd}`,
      fontWeight: 700,
      fontFamily: 'var(--font-sans)',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ProgressBar — track + fill for badge tiers, knute-folder completion, etc.
 * Rounded, ink-bordered track. `tone` colors the fill.
 */
function ProgressBar({
  value = 0,
  max = 100,
  tone = 'primary',
  height = 12,
  showLabel = false,
  label,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const fills = {
    primary: 'var(--primary)',
    accent: 'var(--accent)',
    success: 'var(--success)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), showLabel && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6,
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)'
    }
  }, value, "/", max)), /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      borderRadius: 'var(--radius-full)',
      background: 'var(--surface-soft)',
      border: '1.5px solid var(--line-strong)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      background: fills[tone] || fills.primary,
      borderRadius: 'var(--radius-full)',
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/StatTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatTile — a compact stat readout (points, streak, rank, completed knuter).
 * Big display number, label below, optional icon. Numbers use the mono face.
 */
function StatTile({
  value,
  label,
  icon,
  tone = 'card',
  align = 'left',
  style,
  ...rest
}) {
  const tones = {
    card: {
      background: 'var(--card)',
      color: 'var(--text)',
      sub: 'var(--text-muted)'
    },
    primary: {
      background: 'var(--primary)',
      color: 'var(--text-inverse)',
      sub: 'color-mix(in srgb, var(--text-inverse) 72%, transparent)'
    },
    accent: {
      background: 'var(--accent)',
      color: 'var(--accent-foreground)',
      sub: 'color-mix(in srgb, var(--accent-foreground) 70%, transparent)'
    },
    soft: {
      background: 'var(--surface-soft)',
      color: 'var(--text)',
      sub: 'var(--text-muted)'
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "sticker",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align,
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      background: t.background,
      color: t.color,
      minWidth: 96,
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      marginBottom: 2,
      opacity: 0.95
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 'var(--text-2xl)',
      lineHeight: 1,
      letterSpacing: '-0.02em'
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: t.sub
    }
  }, label));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/core/StickerCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StickerCard — the base Knuteloop surface. White card with the signature
 * 2px ink border + hard offset shadow. `interactive` adds the lift/press feel.
 */
function StickerCard({
  children,
  as: Tag = 'div',
  padding = 'lg',
  radius = 'lg',
  interactive = false,
  tone = 'card',
  style,
  className,
  ...rest
}) {
  const pads = {
    none: 0,
    sm: 'var(--space-3)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)',
    xl: 'var(--space-8)'
  };
  const radii = {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)'
  };
  const tones = {
    card: {
      background: 'var(--card)',
      color: 'var(--text)'
    },
    soft: {
      background: 'var(--surface-soft)',
      color: 'var(--text)'
    },
    primary: {
      background: 'var(--primary)',
      color: 'var(--text-inverse)'
    },
    accent: {
      background: 'var(--accent)',
      color: 'var(--accent-foreground)'
    }
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: [interactive ? 'sticker' : null, className].filter(Boolean).join(' ') || undefined,
    style: {
      ...tones[tone],
      padding: pads[padding],
      borderRadius: radii[radius],
      border: interactive ? undefined : 'var(--border-sticker)',
      boxShadow: interactive ? undefined : 'var(--shadow-sticker)',
      cursor: interactive ? 'pointer' : undefined,
      textAlign: 'left',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { StickerCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StickerCard.jsx", error: String((e && e.message) || e) }); }

// components/knuter/BadgeMedallion.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TIER = {
  bronze: {
    grad: 'var(--tier-bronze)',
    label: 'Bronse',
    glow: 'none'
  },
  sølv: {
    grad: 'var(--tier-silver)',
    label: 'Sølv',
    glow: 'none'
  },
  gull: {
    grad: 'var(--tier-gold)',
    label: 'Gull',
    glow: '0 0 16px rgba(255,200,60,0.45)'
  },
  diamant: {
    grad: 'var(--tier-diamond)',
    label: 'Diamant',
    glow: '0 0 22px rgba(120,200,240,0.6)'
  }
};

/**
 * BadgeMedallion — an achievement badge with a tiered metallic ring.
 * `tier`: bronze / sølv / gull / diamant. Shows the icon, name, and tier.
 * `locked` desaturates it.
 */
function BadgeMedallion({
  icon,
  name,
  tier = 'bronze',
  caption,
  locked = false,
  size = 72,
  style,
  ...rest
}) {
  const t = TIER[tier] || TIER.bronze;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      textAlign: 'center',
      width: 'fit-content',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: size,
      height: size,
      borderRadius: 'var(--radius-full)',
      background: locked ? 'var(--surface-soft)' : t.grad,
      border: '2px solid var(--foreground)',
      boxShadow: locked ? 'none' : t.glow,
      filter: locked ? 'grayscale(1) opacity(0.55)' : 'none',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: '74%',
      height: '74%',
      borderRadius: 'var(--radius-full)',
      background: 'var(--card)',
      boxShadow: 'inset 0 1px 4px rgba(15,26,46,0.12)',
      color: 'var(--foreground)',
      fontSize: size * 0.34
    }
  }, icon)), name && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-strong)',
      lineHeight: 1.05
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.68rem',
      fontWeight: 800,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: locked ? 'var(--text-muted)' : 'var(--accent-strong)'
    }
  }, locked ? 'Låst' : t.label, caption ? ` · ${caption}` : ''));
}
Object.assign(__ds_scope, { BadgeMedallion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/knuter/BadgeMedallion.jsx", error: String((e && e.message) || e) }); }

// components/knuter/KnuteCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CATEGORY_ICON = {
  Generelle: 'generelle',
  Dobbelknuter: 'dobbel',
  Alkoholknuter: 'alkohol',
  Sexknuter: 'sex',
  'Fordervett-knuter': 'fordervett'
};
const DIFF_TONE = {
  Lett: 'success',
  Medium: 'warning',
  Hard: 'danger'
};
const STATUS = {
  Godkjent: {
    tone: 'success',
    label: 'Godkjent'
  },
  Venter: {
    tone: 'warning',
    label: 'Venter'
  },
  Avvist: {
    tone: 'danger',
    label: 'Avvist'
  },
  Tilgjengelig: {
    tone: 'neutral',
    label: 'Tilgjengelig'
  }
};

/**
 * KnuteCard — a single challenge ("knute") in the catalog or feed: title,
 * description, category, difficulty, points, status. Tappable sticker card.
 */
function KnuteCard({
  title,
  description,
  category = 'Generelle',
  difficulty = 'Lett',
  points = 10,
  status = 'Tilgjengelig',
  gold = false,
  onPress,
  style,
  ...rest
}) {
  const st = STATUS[status] || STATUS.Tilgjengelig;
  const glyph = CATEGORY_ICON[category] || 'generelle';
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "sticker",
    role: onPress ? 'button' : undefined,
    onClick: onPress,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      padding: 'var(--space-5)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--card)',
      cursor: onPress ? 'pointer' : 'default',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: 'var(--radius-md)',
      background: gold ? 'var(--tier-gold)' : 'var(--primary-bg)',
      color: gold ? 'var(--foreground)' : 'var(--primary)',
      border: '2px solid var(--foreground)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.KnoteIcon, {
    name: glyph,
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 'var(--text-lg)',
      lineHeight: 1.1,
      color: 'var(--text-strong)',
      margin: 0
    }
  }, gold && /*#__PURE__*/React.createElement("span", {
    title: "Gullknute",
    style: {
      color: '#d6a429'
    }
  }, "\u2605 "), title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 4,
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      lineHeight: 1.45
    }
  }, description))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    tone: "primary",
    icon: /*#__PURE__*/React.createElement(__ds_scope.KnoteIcon, {
      name: glyph,
      size: 13
    })
  }, category), /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    tone: DIFF_TONE[difficulty] || 'neutral'
  }, difficulty), /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    tone: "accent"
  }, points, " poeng"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    tone: st.tone,
    outline: status === 'Tilgjengelig'
  }, st.label)));
}
Object.assign(__ds_scope, { KnuteCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/knuter/KnuteCard.jsx", error: String((e && e.message) || e) }); }

// components/knuter/LeaderRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Leaderboard rank → title (v1 spec §6). */
function getLeaderboardTitle(rank) {
  if (rank === 1) return "O' Store Knutemester";
  if (rank <= 3) return 'Knutemester';
  if (rank <= 10) return 'Knutebaron';
  if (rank <= 20) return 'Knuteridder';
  if (rank <= 35) return 'Knutesersjant';
  if (rank <= 55) return 'Knuteknekt';
  if (rank <= 80) return 'Knutelærling';
  if (rank <= 110) return 'Knuteamatør';
  if (rank <= 145) return 'Knuteprøvling';
  if (rank <= 185) return 'Knutetabbe';
  if (rank <= 220) return 'Knutenybegynner';
  return 'Knutekatastrofen';
}
const MEDAL = {
  1: '#d6a429',
  2: '#9ea4ad',
  3: '#b07a47'
};

/**
 * LeaderRow — one row of the toppliste: rank, avatar, russenavn + rank title,
 * points. `highlight` marks the signed-in user. `showTitle` shows the rank title.
 */
function LeaderRow({
  rank,
  name,
  group,
  points,
  russType = 'blue',
  photoUrl,
  highlight = false,
  showTitle = true,
  style,
  ...rest
}) {
  const medal = MEDAL[rank];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "sticker",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: 'var(--radius-md)',
      background: highlight ? 'var(--accent-bg)' : 'var(--card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 38,
      height: 38,
      flexShrink: 0,
      borderRadius: 'var(--radius-full)',
      background: medal || 'var(--surface-soft)',
      color: medal ? '#fff' : 'var(--text-soft)',
      border: '2px solid var(--foreground)',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 'var(--text-base)'
    }
  }, rank), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: photoUrl,
    size: 44,
    ring: russType
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 'var(--text-base)',
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, showTitle ? getLeaderboardTitle(rank) : group, showTitle && group ? ` · ${group}` : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: 'var(--text-lg)',
      color: 'var(--text-strong)',
      lineHeight: 1
    }
  }, new Intl.NumberFormat('nb-NO').format(points)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.66rem',
      fontWeight: 800,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, "poeng")));
}
Object.assign(__ds_scope, { getLeaderboardTitle, LeaderRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/knuter/LeaderRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/knutebibliotek/app.jsx
try { (() => {
/* Knutebibliotek — klikkbar mobil-prototype for knutesjefer.
   "Spotify for knutesjefer": bla i biblioteket, importer knuter til skolens mapper,
   lag egne mapper og egne knuter. Hver knute har ÉN hjemmemappe + virtuell "Alle knuter". */
const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;
const DS = window.KnuteloopDesignSystem_89dd9e;
const {
  Button,
  Chip,
  StickerCard,
  KnoteIcon,
  Avatar,
  StatTile,
  ProgressBar
} = DS;
const {
  FOLDERS,
  ALLE,
  FMETA,
  KNUTER,
  diff,
  SCHOOL,
  PACK
} = window.KB;
const DIFF_TONE = {
  Lett: 'success',
  Medium: 'warning',
  Hard: 'danger',
  Valgfri: 'neutral'
};
const fmt = n => new Intl.NumberFormat('nb-NO').format(n);
const slug = s => 'cf_' + s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) + '_' + Math.random().toString(36).slice(2, 6);

/* ---------- Icons (generic UI glyphs; brand glyphs come from KnoteIcon) ---------- */
const ICONS = {
  Search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  X: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  Plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  Trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  ListPlus: '<path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>',
  TrendingUp: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
  ShieldAlert: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  SlidersHorizontal: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  Home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  Activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  LibraryBig: '<rect width="8" height="18" x="3" y="3" rx="1"/><path d="M7 3v18"/><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6z"/>',
  User: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  Signal: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  Wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  BatteryFull: '<rect width="16" height="10" x="2" y="7" rx="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/><line x1="14" x2="14" y1="11" y2="13"/>',
  ChevronRight: '<path d="m9 18 6-6-6-6"/>',
  ArrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  FolderPlus: '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  Folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  PenLine: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  Dumbbell: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  Utensils: '<path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  Music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  Star: '<path d="M11.5 2.3a.5.5 0 0 1 1 0l2.3 4.7 5.2.7a.5.5 0 0 1 .3.9l-3.8 3.6.9 5.2a.5.5 0 0 1-.8.5L12 16.3 7.4 18.7a.5.5 0 0 1-.8-.5l.9-5.2-3.8-3.6a.5.5 0 0 1 .3-.9l5.2-.7z"/>',
  Heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  Trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  Camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'
};
function Lc({
  name,
  size = 22,
  sw = 1.8,
  style
}) {
  const d = ICONS[name];
  if (!d) return null;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style,
    dangerouslySetInnerHTML: {
      __html: d
    }
  });
}
/* Folder glyph — brand (KnoteIcon) or lucide, from a folder meta */
function Glyph({
  meta,
  size = 22
}) {
  if (!meta || !meta.g) return /*#__PURE__*/React.createElement(Lc, {
    name: "Folder",
    size: size
  });
  return meta.g.t === 'brand' ? /*#__PURE__*/React.createElement(KnoteIcon, {
    name: meta.g.n,
    size: size
  }) : /*#__PURE__*/React.createElement(Lc, {
    name: meta.g.n,
    size: size
  });
}

/* ---------- persistence ---------- */
const LS = {
  get(k, f) {
    try {
      const v = localStorage.getItem(k);
      return v == null ? f : JSON.parse(v);
    } catch (e) {
      return f;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }
};
const ADDED_BY = KNUTER.reduce((m, k) => {
  if (k.addedBy) m[k.id] = k.addedBy;
  return m;
}, {});

/* ============================== ROOT ============================== */
function App() {
  const [tab, setTab] = useState(() => LS.get('kb.tab.v2', 'utforsk'));
  const [added, setAdded] = useState(() => LS.get('kb.added.v2', KNUTER.filter(k => k.added).map(k => k.id)));
  const [addedBy, setAddedBy] = useState(() => LS.get('kb.addedby.v2', ADDED_BY));
  const [customKnuter, setCustomKnuter] = useState(() => LS.get('kb.cknuter.v2', []));
  const [customFolders, setCustomFolders] = useState(() => LS.get('kb.cfolders.v2', []));
  const [browseFolder, setBrowseFolder] = useState('Alle');
  const [openFolder, setOpenFolder] = useState(null);
  const [sheet, setSheet] = useState(null); // knute object
  const [confirm, setConfirm] = useState(null); // knute pending sensitive add
  const [createFolder, setCreateFolder] = useState(false);
  const [createKnute, setCreateKnute] = useState(null); // {presetFolder} | null
  const [toast, setToast] = useState(null);
  const [tweaks, setTweaks] = useState(() => LS.get('kb.tweaks.v2', {
    frictionGated: true,
    density: 'komfortabel',
    social: true
  }));
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const toastTimer = useRef(null);
  useEffect(() => LS.set('kb.added.v2', added), [added]);
  useEffect(() => LS.set('kb.addedby.v2', addedBy), [addedBy]);
  useEffect(() => LS.set('kb.cknuter.v2', customKnuter), [customKnuter]);
  useEffect(() => LS.set('kb.cfolders.v2', customFolders), [customFolders]);
  useEffect(() => LS.set('kb.tab.v2', tab), [tab]);
  useEffect(() => LS.set('kb.tweaks.v2', tweaks), [tweaks]);
  const allKnuter = useMemo(() => KNUTER.concat(customKnuter), [customKnuter]);
  const allFolders = useMemo(() => FOLDERS.concat(customFolders), [customFolders]);
  const addedSet = useMemo(() => new Set(added), [added]);
  const getFolder = key => FMETA[key] || customFolders.find(f => f.key === key) || ALLE;
  function showToast(msg, tone) {
    setToast({
      msg,
      tone: tone || 'success'
    });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }
  function doAdd(k) {
    setAdded(a => a.includes(k.id) ? a : [...a, k.id]);
    setAddedBy(m => ({
      ...m,
      [k.id]: null
    }));
    showToast(`Lagt til i ${getFolder(k.folder).label} ✓`, 'success');
  }
  function toggle(k) {
    if (addedSet.has(k.id)) {
      setAdded(a => a.filter(id => id !== k.id));
      showToast('Fjernet fra knuteboka', 'neutral');
      return;
    }
    if (tweaks.frictionGated && k.sensitive) {
      setConfirm(k);
      return;
    }
    doAdd(k);
  }
  function addPack() {
    const ids = KNUTER.filter(k => k.pack && !addedSet.has(k.id)).map(k => k.id);
    if (!ids.length) {
      showToast('Alle starter-knuter er allerede lagt til', 'neutral');
      return;
    }
    setAdded(a => [...a, ...ids]);
    showToast(ids.length + ' knuter lagt til ✓', 'success');
  }
  function addFolderAll(folderKey) {
    const ids = KNUTER.filter(k => k.folder === folderKey && !addedSet.has(k.id)).map(k => k.id);
    if (!ids.length) {
      showToast('Alt i denne mappa er lagt til', 'neutral');
      return;
    }
    setAdded(a => [...a, ...ids]);
    showToast(ids.length + ' knuter lagt til ✓', 'success');
  }
  function onCreateFolder({
    label,
    iconName
  }) {
    const f = {
      key: slug(label),
      label,
      g: {
        t: 'lucide',
        n: iconName
      },
      custom: true
    };
    setCustomFolders(cf => [...cf, f]);
    setCreateFolder(false);
    showToast('Mappe «' + label + '» opprettet ✓', 'success');
    return f.key;
  }
  function onCreateKnute(data) {
    const k = {
      id: 'ck_' + Math.random().toString(36).slice(2, 8),
      name: data.name,
      points: Number(data.points) || 0,
      desc: data.desc,
      folder: data.folder,
      evidence: data.evidence,
      age: data.evidence === 'text' ? 18 : 17,
      schools: 1,
      pack: false,
      added: true,
      addedBy: null,
      gold: false,
      difficulty: diff(Number(data.points) || 0),
      sensitive: !!getFolder(data.folder).sensitive,
      custom: true
    };
    setCustomKnuter(c => [...c, k]);
    setAdded(a => [...a, k.id]);
    setAddedBy(m => ({
      ...m,
      [k.id]: null
    }));
    setCreateKnute(null);
    showToast('Egen knute «' + data.name + '» lagt til ✓', 'success');
  }
  function goBrowseFolder(folderKey) {
    setBrowseFolder(folderKey);
    setOpenFolder(null);
    setTab('utforsk');
  }
  return /*#__PURE__*/React.createElement("div", {
    style: st.stage
  }, /*#__PURE__*/React.createElement("div", {
    style: st.phone,
    className: "kb-phone"
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: st.screen,
    className: "knuteloop-canvas kb-scroll"
  }, tab === 'utforsk' && /*#__PURE__*/React.createElement(Utforsk, {
    allKnuter: allKnuter,
    addedSet: addedSet,
    addedBy: addedBy,
    tweaks: tweaks,
    getFolder: getFolder,
    folder: browseFolder,
    setFolder: setBrowseFolder,
    onToggle: toggle,
    onOpen: setSheet,
    onAddPack: addPack,
    onAddFolder: addFolderAll
  }), tab === 'knuteboka' && !openFolder && /*#__PURE__*/React.createElement(Knuteboka, {
    allKnuter: allKnuter,
    allFolders: allFolders,
    addedSet: addedSet,
    getFolder: getFolder,
    onOpenFolder: setOpenFolder,
    goBrowse: () => setTab('utforsk'),
    onNewFolder: () => setCreateFolder(true),
    onNewKnute: () => setCreateKnute({})
  }), tab === 'knuteboka' && openFolder && /*#__PURE__*/React.createElement(FolderView, {
    folderKey: openFolder,
    meta: getFolder(openFolder),
    allKnuter: allKnuter,
    addedSet: addedSet,
    addedBy: addedBy,
    tweaks: tweaks,
    getFolder: getFolder,
    onBack: () => setOpenFolder(null),
    onToggle: toggle,
    onOpen: setSheet,
    goBrowse: goBrowseFolder,
    onNewKnute: k => setCreateKnute({
      presetFolder: k
    })
  })), /*#__PURE__*/React.createElement(BottomNav, {
    tab: tab,
    setTab: t => {
      setTab(t);
      setOpenFolder(null);
    },
    count: added.length
  }), sheet && /*#__PURE__*/React.createElement(DetailSheet, {
    k: sheet,
    added: addedSet.has(sheet.id),
    addedBy: addedBy[sheet.id],
    tweaks: tweaks,
    meta: getFolder(sheet.folder),
    onClose: () => setSheet(null),
    onToggle: () => toggle(sheet)
  }), confirm && /*#__PURE__*/React.createElement(ConfirmSheet, {
    k: confirm,
    meta: getFolder(confirm.folder),
    onCancel: () => setConfirm(null),
    onConfirm: () => {
      doAdd(confirm);
      setConfirm(null);
    }
  }), createFolder && /*#__PURE__*/React.createElement(CreateFolderSheet, {
    onClose: () => setCreateFolder(false),
    onCreate: onCreateFolder
  }), createKnute && /*#__PURE__*/React.createElement(CreateKnuteSheet, {
    allFolders: allFolders,
    preset: createKnute.presetFolder,
    onClose: () => setCreateKnute(null),
    onCreate: onCreateKnute
  }), toast && /*#__PURE__*/React.createElement(Toast, toast), /*#__PURE__*/React.createElement("button", {
    style: st.tweakFab,
    className: "sticker",
    onClick: () => setTweaksOpen(o => !o),
    title: "Tweaks"
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "SlidersHorizontal",
    size: 20
  })), tweaksOpen && /*#__PURE__*/React.createElement(Tweaks, {
    tweaks: tweaks,
    setTweaks: setTweaks,
    onClose: () => setTweaksOpen(false)
  })));
}

/* ============================== UTFORSK (bibliotek) ============================== */
function Utforsk({
  allKnuter,
  addedSet,
  addedBy,
  tweaks,
  getFolder,
  folder,
  setFolder,
  onToggle,
  onOpen,
  onAddPack,
  onAddFolder
}) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return KNUTER.filter(k => {
      if (folder !== 'Alle' && k.folder !== folder) return false;
      if (term && !(k.name.toLowerCase().includes(term) || k.desc.toLowerCase().includes(term))) return false;
      return true;
    }).sort((a, b) => FOLDERS.findIndex(f => f.key === a.folder) - FOLDERS.findIndex(f => f.key === b.folder) || a.points - b.points);
  }, [q, folder]);
  const searching = q.trim().length > 0;
  const packAdded = KNUTER.filter(k => k.pack && addedSet.has(k.id)).length;
  const packTotal = KNUTER.filter(k => k.pack).length;
  const fmeta = folder !== 'Alle' ? getFolder(folder) : null;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: st.head
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Knutesjef \xB7 ", SCHOOL.name), /*#__PURE__*/React.createElement("h1", {
    style: st.h1
  }, "Biblioteket")), /*#__PURE__*/React.createElement(Avatar, {
    name: SCHOOL.russenavn,
    size: 42,
    ring: "blue"
  })), /*#__PURE__*/React.createElement("p", {
    style: st.lede
  }, "Bla gjennom alle knuter og legg dem i skolens mapper.")), /*#__PURE__*/React.createElement(SearchBar, {
    value: q,
    onChange: setQ
  }), /*#__PURE__*/React.createElement(FolderChips, {
    value: folder,
    onChange: setFolder,
    getFolder: getFolder
  }), !searching && folder === 'Alle' && /*#__PURE__*/React.createElement(PackHero, {
    added: packAdded,
    total: packTotal,
    onAddPack: onAddPack
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...st.sectionRow,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: st.sectionLabel
  }, searching ? `Treff på «${q.trim()}»` : fmeta ? fmeta.label : 'Alle knuter'), /*#__PURE__*/React.createElement("span", {
    style: st.countPill
  }, list.length)), fmeta && fmeta.note && /*#__PURE__*/React.createElement("div", {
    style: st.folderNote
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "TrendingUp",
    size: 14,
    sw: 2.2
  }), fmeta.note), fmeta && !searching && list.some(k => !addedSet.has(k.id)) && /*#__PURE__*/React.createElement("button", {
    style: st.addAllBtn,
    className: "sticker",
    onClick: () => onAddFolder(folder)
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "ListPlus",
    size: 17
  }), "Legg til hele \xAB", fmeta.label, "\xBB"), list.length === 0 ? /*#__PURE__*/React.createElement(Empty, null) : /*#__PURE__*/React.createElement(CatalogCard, {
    list: list,
    addedSet: addedSet,
    addedBy: addedBy,
    tweaks: tweaks,
    getFolder: getFolder,
    onToggle: onToggle,
    onOpen: onOpen
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }));
}

/* ============================== KNUTEBOKA (Ditt bibliotek) ============================== */
function Knuteboka({
  allKnuter,
  allFolders,
  addedSet,
  getFolder,
  onOpenFolder,
  goBrowse,
  onNewFolder,
  onNewKnute
}) {
  const mine = allKnuter.filter(k => addedSet.has(k.id));
  const points = mine.reduce((s, k) => s + k.points, 0);
  const counts = {};
  mine.forEach(k => {
    counts[k.folder] = (counts[k.folder] || 0) + 1;
  });
  const folderRows = allFolders.filter(f => counts[f.key] || f.custom);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("header", {
    style: st.head
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, SCHOOL.name), /*#__PURE__*/React.createElement("h1", {
    style: st.h1
  }, "Knuteboka"), /*#__PURE__*/React.createElement("p", {
    style: st.lede
  }, "Skolens mapper. Forvaltes sammen med ", SCHOOL.co, ".")), /*#__PURE__*/React.createElement("div", {
    style: st.statRow
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: mine.length,
    label: "Knuter",
    tone: "primary",
    align: "center",
    icon: /*#__PURE__*/React.createElement(KnoteIcon, {
      name: "knute",
      size: 20
    })
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: fmt(points),
    label: "Poeng",
    tone: "accent",
    align: "center",
    icon: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18
      }
    }, "\u2B50")
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: folderRows.length,
    label: "Mapper",
    tone: "card",
    align: "center",
    icon: /*#__PURE__*/React.createElement(Lc, {
      name: "Folder",
      size: 18
    })
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      ...st.alleCard
    },
    className: "sticker",
    onClick: () => onOpenFolder('Alle')
  }, /*#__PURE__*/React.createElement("span", {
    style: st.alleGlyph
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "LibraryBig",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'left',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: st.folderRowTitle
  }, "Alle knuter"), /*#__PURE__*/React.createElement("div", {
    style: st.folderRowSub
  }, "Hele knuteboka \xB7 driver s\xF8ket")), /*#__PURE__*/React.createElement("span", {
    style: st.folderCount
  }, mine.length), /*#__PURE__*/React.createElement(Lc, {
    name: "ChevronRight",
    size: 20,
    style: {
      color: 'var(--text-muted)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...st.sectionRow,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: st.sectionLabel
  }, "Mappene dine"), /*#__PURE__*/React.createElement("span", {
    style: st.countPill
  }, folderRows.length)), /*#__PURE__*/React.createElement(StickerCard, {
    padding: "none",
    style: {
      overflow: 'hidden',
      marginTop: 12
    }
  }, folderRows.map((f, i) => /*#__PURE__*/React.createElement("button", {
    key: f.key,
    className: "kb-row",
    onClick: () => onOpenFolder(f.key),
    style: {
      ...st.folderRow,
      borderTop: i === 0 ? 'none' : '1.5px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...st.folderRowGlyph,
      background: f.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)',
      color: f.sensitive ? 'var(--accent-strong)' : 'var(--primary)'
    }
  }, /*#__PURE__*/React.createElement(Glyph, {
    meta: f,
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'left',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: st.folderRowTitle
  }, f.label, f.custom && /*#__PURE__*/React.createElement("span", {
    style: st.egenTag
  }, "EGEN")), /*#__PURE__*/React.createElement("div", {
    style: st.folderRowSub
  }, f.note ? f.note : counts[f.key] ? counts[f.key] + ' knuter' : 'Tom mappe')), /*#__PURE__*/React.createElement("span", {
    style: st.folderCount
  }, counts[f.key] || 0), /*#__PURE__*/React.createElement(Lc, {
    name: "ChevronRight",
    size: 20,
    style: {
      color: 'var(--text-muted)'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    onClick: onNewFolder,
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: "FolderPlus",
      size: 18
    })
  }, "Ny mappe"), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    fullWidth: true,
    onClick: onNewKnute,
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: "PenLine",
      size: 18
    })
  }, "Lag egen knute")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    fullWidth: true,
    onClick: goBrowse,
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: "Search",
      size: 18
    })
  }, "Finn flere i biblioteket")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }));
}

/* ============================== FOLDER VIEW (drill-inn) ============================== */
function FolderView({
  folderKey,
  meta,
  allKnuter,
  addedSet,
  addedBy,
  tweaks,
  getFolder,
  onBack,
  onToggle,
  onOpen,
  goBrowse,
  onNewKnute
}) {
  const isAlle = folderKey === 'Alle';
  const items = allKnuter.filter(k => addedSet.has(k.id) && (isAlle || k.folder === folderKey)).sort((a, b) => a.points - b.points);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    style: st.backBtn,
    className: "kb-row",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "ArrowLeft",
    size: 20,
    sw: 2.2
  }), "Knuteboka"), /*#__PURE__*/React.createElement("div", {
    style: st.folderHead
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...st.folderHeadGlyph,
      background: meta.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)',
      color: meta.sensitive ? 'var(--accent-strong)' : 'var(--primary)'
    }
  }, /*#__PURE__*/React.createElement(Glyph, {
    meta: meta,
    size: 32
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      ...st.h1,
      fontSize: '1.8rem'
    }
  }, meta.label), /*#__PURE__*/React.createElement("div", {
    style: st.folderRowSub
  }, items.length, " knuter", meta.custom ? ' · egen mappe' : ''))), meta.note && /*#__PURE__*/React.createElement("div", {
    style: st.folderNote
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "TrendingUp",
    size: 14,
    sw: 2.2
  }), meta.note), items.length === 0 ? /*#__PURE__*/React.createElement(StickerCard, {
    style: {
      marginTop: 16,
      textAlign: 'center'
    },
    padding: "xl"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30
    }
  }, "\uD83D\uDCC2"), /*#__PURE__*/React.createElement("h4", {
    style: {
      marginTop: 8
    }
  }, "Ingen knuter her enn\xE5"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 4
    }
  }, meta.custom ? 'Legg til knuter fra biblioteket eller lag en egen.' : 'Legg til knuter fra biblioteket.')) : /*#__PURE__*/React.createElement(CatalogCard, {
    list: items,
    addedSet: addedSet,
    addedBy: addedBy,
    tweaks: tweaks,
    getFolder: getFolder,
    onToggle: onToggle,
    onOpen: onOpen,
    inBook: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 16
    }
  }, !isAlle && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    onClick: () => goBrowse(folderKey),
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: "Plus",
      size: 18
    })
  }, "Legg til flere fra biblioteket"), (meta.custom || isAlle) && /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    fullWidth: true,
    onClick: () => onNewKnute(isAlle ? undefined : folderKey),
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: "PenLine",
      size: 18
    })
  }, "Lag egen knute", !isAlle ? ' her' : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }));
}

/* ============================== CATALOG (tette rader) ============================== */
function CatalogCard({
  list,
  addedSet,
  addedBy,
  tweaks,
  getFolder,
  onToggle,
  onOpen,
  inBook
}) {
  return /*#__PURE__*/React.createElement(StickerCard, {
    padding: "none",
    style: {
      overflow: 'hidden',
      marginTop: 12
    }
  }, list.map((k, i) => /*#__PURE__*/React.createElement(KnuteRow, {
    key: k.id,
    k: k,
    added: addedSet.has(k.id),
    addedBy: addedBy[k.id],
    tweaks: tweaks,
    meta: getFolder(k.folder),
    first: i === 0,
    onToggle: () => onToggle(k),
    onOpen: () => onOpen(k),
    inBook: inBook
  })));
}
function KnuteRow({
  k,
  added,
  addedBy,
  tweaks,
  meta,
  first,
  onToggle,
  onOpen,
  inBook
}) {
  const compact = tweaks.density === 'kompakt';
  return /*#__PURE__*/React.createElement("div", {
    onClick: onOpen,
    style: {
      ...st.row,
      borderTop: first ? 'none' : '1.5px solid var(--line)',
      padding: compact ? '12px 14px' : '15px 16px'
    },
    className: "kb-row"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...st.rowGlyph,
      background: k.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)',
      color: k.sensitive ? 'var(--accent-strong)' : 'var(--primary)'
    }
  }, /*#__PURE__*/React.createElement(Glyph, {
    meta: meta,
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: st.rowTitle
  }, k.gold && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#d6a429'
    }
  }, "\u2605 "), k.name, k.custom && /*#__PURE__*/React.createElement("span", {
    style: st.egenTag
  }, "EGEN")), !compact && /*#__PURE__*/React.createElement("div", {
    style: st.rowDesc
  }, k.desc), /*#__PURE__*/React.createElement("div", {
    style: st.rowMeta
  }, /*#__PURE__*/React.createElement(Chip, {
    tone: "accent",
    size: "sm"
  }, k.points, " P"), /*#__PURE__*/React.createElement(Chip, {
    tone: DIFF_TONE[k.difficulty],
    size: "sm"
  }, k.difficulty), k.age >= 18 && /*#__PURE__*/React.createElement(Badge, null, "18+"), k.evidence === 'text' && /*#__PURE__*/React.createElement(Badge, null, "Tekst-bevis"), tweaks.social && !compact && !k.custom && /*#__PURE__*/React.createElement("span", {
    style: st.social
  }, "\xB7 ", fmt(k.schools), " skoler"), inBook && addedBy && /*#__PURE__*/React.createElement("span", {
    style: st.addedBy
  }, "\xB7 ", addedBy))), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onToggle();
    },
    className: "sticker kb-toggle",
    "aria-label": added ? 'Fjern' : 'Legg til',
    style: {
      ...st.toggle,
      background: added ? 'var(--foreground)' : 'var(--card)',
      color: added ? 'var(--card)' : 'var(--primary)'
    }
  }, /*#__PURE__*/React.createElement(Lc, {
    name: added ? inBook ? 'Trash' : 'Check' : 'Plus',
    size: inBook ? 18 : 20,
    sw: 2.2
  })));
}
function Badge({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: st.miniBadge
  }, children);
}

/* ============================== STARTER PACK ============================== */
function PackHero({
  added,
  total,
  onAddPack
}) {
  const done = added >= total;
  return /*#__PURE__*/React.createElement(StickerCard, {
    tone: "primary",
    padding: "lg",
    style: {
      marginTop: 16,
      color: 'var(--text-inverse)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: st.packGlyph
  }, /*#__PURE__*/React.createElement(KnoteIcon, {
    name: "knute",
    size: 26
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      opacity: 0.85
    }
  }, "Pakke \xB7 ", total, " knuter"), /*#__PURE__*/React.createElement("h3", {
    style: {
      color: 'var(--text-inverse)',
      fontSize: '1.25rem',
      marginTop: 2
    }
  }, PACK.name))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-inverse)',
      opacity: 0.9,
      marginTop: 8,
      fontSize: 'var(--text-sm)'
    }
  }, PACK.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 0 12px'
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: added,
    max: total,
    tone: "accent",
    height: 10
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      opacity: 0.85,
      marginTop: 6
    }
  }, added, " av ", total, " lagt til")), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    fullWidth: true,
    onClick: onAddPack,
    disabled: done,
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: done ? 'Check' : 'ListPlus',
      size: 18
    })
  }, done ? 'Hele pakka er lagt til' : `Legg til alle ${total}`));
}

/* ============================== DETALJ-SHEET ============================== */
function DetailSheet({
  k,
  added,
  addedBy,
  tweaks,
  meta,
  onClose,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: st.scrim,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: st.sheet,
    className: "kb-sheet",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: st.sheetGrab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...st.sheetGlyph,
      background: k.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)',
      color: k.sensitive ? 'var(--accent-strong)' : 'var(--primary)'
    }
  }, /*#__PURE__*/React.createElement(Glyph, {
    meta: meta,
    size: 30
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.6rem',
      lineHeight: 1.05
    }
  }, k.gold && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#d6a429'
    }
  }, "\u2605 "), k.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    tone: "accent"
  }, k.points, " poeng"), /*#__PURE__*/React.createElement(Chip, {
    tone: DIFF_TONE[k.difficulty]
  }, k.difficulty), /*#__PURE__*/React.createElement(Chip, {
    tone: "primary",
    icon: /*#__PURE__*/React.createElement(Glyph, {
      meta: meta,
      size: 13
    })
  }, meta.label))), /*#__PURE__*/React.createElement("button", {
    style: st.sheetX,
    onClick: onClose,
    "aria-label": "Lukk"
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "X",
    size: 20,
    sw: 2.2
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      fontSize: 'var(--text-base)',
      color: 'var(--text)',
      lineHeight: 1.55
    }
  }, k.desc), meta.note && /*#__PURE__*/React.createElement("div", {
    style: st.folderNote
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "TrendingUp",
    size: 14,
    sw: 2.2
  }), meta.note), /*#__PURE__*/React.createElement("div", {
    style: st.metaGrid
  }, /*#__PURE__*/React.createElement(Meta, {
    label: "Hjemmemappe",
    value: meta.label
  }), /*#__PURE__*/React.createElement(Meta, {
    label: "Vanskelighet",
    value: k.difficulty
  }), /*#__PURE__*/React.createElement(Meta, {
    label: "Bevis",
    value: k.evidence === 'text' ? 'Tekst' : 'Bilde / video'
  }), /*#__PURE__*/React.createElement(Meta, {
    label: "Alder",
    value: k.age >= 18 ? '18+' : '17+'
  })), tweaks.social && !k.custom && /*#__PURE__*/React.createElement("div", {
    style: st.socialBox
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "TrendingUp",
    size: 18,
    sw: 2,
    style: {
      color: 'var(--primary)'
    }
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, fmt(k.schools), " skoler"), " har denne i knuteboka si")), added && /*#__PURE__*/React.createElement("div", {
    style: st.addedNote
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "Check",
    size: 16,
    sw: 2.4,
    style: {
      color: 'var(--success)'
    }
  }), "I knuteboka", addedBy ? /*#__PURE__*/React.createElement(React.Fragment, null, " \u2014 lagt til av ", /*#__PURE__*/React.createElement("strong", null, addedBy)) : ' — lagt til av deg'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: added ? 'secondary' : 'accent',
    fullWidth: true,
    onClick: onToggle,
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: added ? 'Trash' : 'Plus',
      size: 18,
      sw: 2.2
    })
  }, added ? 'Fjern fra knuteboka' : 'Legg til i knuteboka'))));
}
function Meta({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: st.metaCell
  }, /*#__PURE__*/React.createElement("div", {
    style: st.metaLabel
  }, label), /*#__PURE__*/React.createElement("div", {
    style: st.metaValue
  }, value));
}

/* ============================== CONFIRM (friksjon på sensitivt) ============================== */
function ConfirmSheet({
  k,
  meta,
  onCancel,
  onConfirm
}) {
  const isSex = k.folder === 'Sex';
  return /*#__PURE__*/React.createElement("div", {
    style: st.scrim,
    onClick: onCancel
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...st.sheet,
      paddingBottom: 22
    },
    className: "kb-sheet",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: st.sheetGrab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...st.sheetGlyph,
      background: 'var(--accent-bg)',
      color: 'var(--accent-strong)'
    }
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "ShieldAlert",
    size: 26
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.3rem'
    }
  }, "Sensitiv knute"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, meta.label, "-mappa"))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 14,
      lineHeight: 1.55
    }
  }, /*#__PURE__*/React.createElement("strong", null, k.name), " ligger i ", meta.label, "-mappa", isSex ? ' (18+, kun tekst-bevis)' : '', ". Legg den til i knuteboka til ", SCHOOL.name, "?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    fullWidth: true,
    onClick: onCancel
  }, "Avbryt"), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    fullWidth: true,
    onClick: onConfirm
  }, "Legg til"))));
}

/* ============================== LAG EGEN MAPPE ============================== */
const FOLDER_ICON_CHOICES = ['Folder', 'Dumbbell', 'Utensils', 'Music', 'Star', 'Heart', 'Trophy', 'Camera'];
function CreateFolderSheet({
  onClose,
  onCreate
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const ok = name.trim().length > 1;
  return /*#__PURE__*/React.createElement("div", {
    style: st.scrim,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...st.sheet,
      paddingBottom: 24
    },
    className: "kb-sheet",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: st.sheetGrab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.5rem'
    }
  }, "Ny mappe"), /*#__PURE__*/React.createElement("button", {
    style: st.sheetX,
    onClick: onClose,
    "aria-label": "Lukk"
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "X",
    size: 20,
    sw: 2.2
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Navn p\xE5 mappa"
  }, /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "F.eks. Sosialt, Tradisjon \u2026",
    style: st.input,
    autoFocus: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Ikon"
  }, /*#__PURE__*/React.createElement("div", {
    style: st.iconGrid
  }, FOLDER_ICON_CHOICES.map(ic => /*#__PURE__*/React.createElement("button", {
    key: ic,
    onClick: () => setIcon(ic),
    className: "sticker",
    style: {
      ...st.iconChoice,
      background: icon === ic ? 'var(--foreground)' : 'var(--card)',
      color: icon === ic ? 'var(--card)' : 'var(--text)'
    }
  }, /*#__PURE__*/React.createElement(Lc, {
    name: ic,
    size: 22
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    fullWidth: true,
    disabled: !ok,
    onClick: () => onCreate({
      label: name.trim(),
      iconName: icon
    }),
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: "FolderPlus",
      size: 18
    })
  }, "Opprett mappe"))));
}

/* ============================== LAG EGEN KNUTE ============================== */
function CreateKnuteSheet({
  allFolders,
  preset,
  onClose,
  onCreate
}) {
  const [name, setName] = useState('');
  const [points, setPoints] = useState('15');
  const [desc, setDesc] = useState('');
  const [folder, setFolder] = useState(preset || allFolders[0].key);
  const [evidence, setEvidence] = useState('media');
  const ok = name.trim().length > 1 && desc.trim().length > 2;
  return /*#__PURE__*/React.createElement("div", {
    style: st.scrim,
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...st.sheet,
      paddingBottom: 24
    },
    className: "kb-sheet",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: st.sheetGrab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.5rem'
    }
  }, "Lag egen knute"), /*#__PURE__*/React.createElement("button", {
    style: st.sheetX,
    onClick: onClose,
    "aria-label": "Lukk"
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "X",
    size: 20,
    sw: 2.2
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Navn"
  }, /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "F.eks. Skolerevyen",
    style: st.input,
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Poeng",
    style: {
      width: 110
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: points,
    onChange: e => setPoints(e.target.value.replace(/[^0-9]/g, '')),
    inputMode: "numeric",
    style: st.input
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Mappe",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: folder,
    onChange: e => setFolder(e.target.value),
    style: st.input
  }, allFolders.map(f => /*#__PURE__*/React.createElement("option", {
    key: f.key,
    value: f.key
  }, f.label))))), /*#__PURE__*/React.createElement(Field, {
    label: "Beskrivelse"
  }, /*#__PURE__*/React.createElement("textarea", {
    value: desc,
    onChange: e => setDesc(e.target.value),
    placeholder: "Hva m\xE5 russen gj\xF8re?",
    rows: 2,
    style: {
      ...st.input,
      resize: 'none',
      lineHeight: 1.4
    }
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Bevis"
  }, /*#__PURE__*/React.createElement("div", {
    style: st.segment
  }, [['media', 'Bilde / video'], ['text', 'Kun tekst']].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setEvidence(v),
    style: {
      ...st.segBtn,
      ...(evidence === v ? st.segOn : {})
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    fullWidth: true,
    disabled: !ok,
    onClick: () => onCreate({
      name: name.trim(),
      points,
      desc: desc.trim(),
      folder,
      evidence
    }),
    iconLeft: /*#__PURE__*/React.createElement(Lc, {
      name: "PenLine",
      size: 18
    })
  }, "Legg til i knuteboka"))));
}
function Field({
  label,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      marginTop: 14,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: st.fieldLabel
  }, label), children);
}

/* ============================== CHROME ============================== */
function SearchBar({
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: st.search,
    className: "sticker"
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "Search",
    size: 19,
    style: {
      color: 'var(--text-muted)',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange(e.target.value),
    placeholder: "S\xF8k i biblioteket\u2026",
    style: st.searchInput
  }), value && /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange(''),
    style: st.searchClear,
    "aria-label": "T\xF8m"
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "X",
    size: 16,
    sw: 2.2
  })));
}
function FolderChips({
  value,
  onChange,
  getFolder
}) {
  const chips = [{
    key: 'Alle',
    label: 'Alle'
  }].concat(FOLDERS);
  return /*#__PURE__*/React.createElement("div", {
    style: st.chipScroll,
    className: "kb-chips"
  }, chips.map(f => {
    const on = value === f.key;
    return /*#__PURE__*/React.createElement("button", {
      key: f.key,
      onClick: () => onChange(f.key),
      className: "sticker",
      style: {
        ...st.fchip,
        background: on ? 'var(--foreground)' : 'var(--card)',
        color: on ? 'var(--card)' : 'var(--text)',
        boxShadow: on ? 'var(--shadow-sticker-sm)' : 'none'
      }
    }, f.g && /*#__PURE__*/React.createElement(Glyph, {
      meta: f,
      size: 15
    }), f.label);
  }));
}
function BottomNav({
  tab,
  setTab,
  count
}) {
  const items = [{
    key: 'hjem',
    label: 'Hjem',
    icon: /*#__PURE__*/React.createElement(Lc, {
      name: "Home",
      size: 22
    }),
    real: false
  }, {
    key: 'feed',
    label: 'Feed',
    icon: /*#__PURE__*/React.createElement(Lc, {
      name: "Activity",
      size: 22
    }),
    real: false
  }, {
    key: 'utforsk',
    label: 'Bibliotek',
    icon: /*#__PURE__*/React.createElement(Lc, {
      name: "LibraryBig",
      size: 22
    }),
    real: true
  }, {
    key: 'knuteboka',
    label: 'Knuteboka',
    icon: /*#__PURE__*/React.createElement(KnoteIcon, {
      name: "knute",
      size: 22
    }),
    real: true,
    badge: count
  }, {
    key: 'profil',
    label: 'Profil',
    icon: /*#__PURE__*/React.createElement(Lc, {
      name: "User",
      size: 22
    }),
    real: false
  }];
  return /*#__PURE__*/React.createElement("nav", {
    style: st.nav,
    className: "sticker"
  }, items.map(it => {
    const on = it.key === tab;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      onClick: () => it.real && setTab(it.key),
      style: {
        ...st.navBtn,
        opacity: it.real ? 1 : 0.45
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...st.navIcon,
        background: on ? 'var(--foreground)' : 'transparent',
        color: on ? 'var(--card)' : 'var(--text)'
      }
    }, it.icon, it.badge ? /*#__PURE__*/React.createElement("span", {
      style: st.navBadge
    }, it.badge) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        ...st.navLabel,
        color: on ? 'var(--text-strong)' : 'var(--text-muted)'
      }
    }, it.label));
  }));
}
function Toast({
  msg,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: st.toast,
    className: "kb-toast sticker"
  }, tone === 'success' && /*#__PURE__*/React.createElement(Lc, {
    name: "Check",
    size: 18,
    sw: 2.6,
    style: {
      color: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("span", null, msg));
}
function Empty() {
  return /*#__PURE__*/React.createElement(StickerCard, {
    style: {
      marginTop: 12,
      textAlign: 'center'
    },
    padding: "xl"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("h4", {
    style: {
      marginTop: 8
    }
  }, "Ingen treff"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 4
    }
  }, "Pr\xF8v et annet s\xF8k eller en annen mappe."));
}
function StatusBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: st.statusbar
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: st.notch
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "Signal",
    size: 15,
    sw: 2.2
  }), /*#__PURE__*/React.createElement(Lc, {
    name: "Wifi",
    size: 15,
    sw: 2.2
  }), /*#__PURE__*/React.createElement(Lc, {
    name: "BatteryFull",
    size: 17,
    sw: 2
  })));
}
function Tweaks({
  tweaks,
  setTweaks,
  onClose
}) {
  const set = (k, v) => setTweaks(t => ({
    ...t,
    [k]: v
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: st.tweakPanel,
    className: "sticker"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 16
    }
  }, "Tweaks"), /*#__PURE__*/React.createElement("button", {
    style: st.sheetX,
    onClick: onClose,
    "aria-label": "Lukk"
  }, /*#__PURE__*/React.createElement(Lc, {
    name: "X",
    size: 16,
    sw: 2.2
  }))), /*#__PURE__*/React.createElement(TwRow, {
    label: "Friksjon p\xE5 18+/sensitivt",
    hint: "Bekreft f\xF8r sensitive knuter legges til"
  }, /*#__PURE__*/React.createElement(Switch, {
    on: tweaks.frictionGated,
    onClick: () => set('frictionGated', !tweaks.frictionGated)
  })), /*#__PURE__*/React.createElement(TwRow, {
    label: "Sosialt bevis",
    hint: "\xABBrukt av N skoler\xBB"
  }, /*#__PURE__*/React.createElement(Switch, {
    on: tweaks.social,
    onClick: () => set('social', !tweaks.social)
  })), /*#__PURE__*/React.createElement(TwRow, {
    label: "Tetthet"
  }, /*#__PURE__*/React.createElement("div", {
    style: st.miniSeg
  }, ['komfortabel', 'kompakt'].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => set('density', d),
    style: {
      ...st.miniSegBtn,
      ...(tweaks.density === d ? st.segOn : {})
    }
  }, d === 'komfortabel' ? 'Komf.' : 'Kompakt')))));
}
function TwRow({
  label,
  hint,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '9px 0',
      borderTop: '1.5px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 13.5
    }
  }, label), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-muted)',
      marginTop: 1
    }
  }, hint)), children);
}
function Switch({
  on,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      ...st.switch,
      background: on ? 'var(--primary)' : 'var(--surface-soft)',
      justifyContent: on ? 'flex-end' : 'flex-start'
    },
    "aria-pressed": on
  }, /*#__PURE__*/React.createElement("span", {
    style: st.switchKnob
  }));
}

/* ============================== STYLES ============================== */
const st = {
  stage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'radial-gradient(circle at 50% 0%, #e9eef7 0%, #dde3ee 60%, #d3d9e6 100%)'
  },
  phone: {
    width: 393,
    height: 852,
    background: 'var(--card)',
    borderRadius: 46,
    border: '2px solid var(--foreground)',
    boxShadow: '0 30px 60px -18px rgba(20,26,48,0.5)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  statusbar: {
    height: 50,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 26px',
    fontSize: 14,
    color: 'var(--foreground)',
    position: 'relative',
    zIndex: 5
  },
  notch: {
    position: 'absolute',
    left: '50%',
    top: 11,
    transform: 'translateX(-50%)',
    width: 116,
    height: 30,
    background: 'var(--foreground)',
    borderRadius: 16
  },
  screen: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 16px 0'
  },
  head: {
    padding: '10px 2px 2px'
  },
  h1: {
    fontSize: '2rem',
    lineHeight: 0.98,
    marginTop: 2
  },
  lede: {
    marginTop: 8,
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    lineHeight: 1.45,
    maxWidth: 320
  },
  search: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--card)',
    borderRadius: 'var(--radius-full)',
    padding: '11px 16px',
    marginTop: 14,
    border: 'var(--border-sticker)',
    boxShadow: 'var(--shadow-sticker-sm)'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 15,
    color: 'var(--text)',
    fontFamily: 'var(--font-sans)'
  },
  searchClear: {
    border: 'none',
    background: 'var(--surface-soft)',
    borderRadius: '50%',
    width: 24,
    height: 24,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    flexShrink: 0
  },
  chipScroll: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    padding: '14px 16px 4px',
    margin: '0 -16px'
  },
  fchip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 15px',
    borderRadius: 'var(--radius-full)',
    border: 'var(--border-sticker)',
    fontWeight: 700,
    fontSize: 13.5,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: 'var(--font-sans)'
  },
  segment: {
    display: 'flex',
    gap: 4,
    background: 'var(--surface-soft)',
    borderRadius: 'var(--radius-full)',
    padding: 4,
    border: '1.5px solid var(--line)'
  },
  segBtn: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    borderRadius: 'var(--radius-full)',
    padding: '9px 8px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-sans)'
  },
  segOn: {
    background: 'var(--card)',
    color: 'var(--text-strong)',
    boxShadow: 'var(--shadow-sticker-sm)'
  },
  sectionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2px'
  },
  sectionLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 15,
    letterSpacing: '-0.01em',
    color: 'var(--text-strong)'
  },
  countPill: {
    fontSize: 12,
    fontWeight: 800,
    color: 'var(--text-muted)',
    background: 'var(--surface-soft)',
    borderRadius: 999,
    padding: '2px 9px',
    fontFamily: 'var(--font-mono)'
  },
  folderNote: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    padding: '7px 12px',
    background: 'var(--primary-bg)',
    border: '1.5px solid color-mix(in srgb, var(--primary) 22%, transparent)',
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--primary-strong)'
  },
  addAllBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: '9px 16px',
    background: 'var(--card)',
    border: 'var(--border-sticker)',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    color: 'var(--text)',
    boxShadow: 'var(--shadow-sticker-sm)',
    fontFamily: 'var(--font-sans)'
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
    marginTop: 16
  },
  alleCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 18,
    padding: '14px 16px',
    background: 'var(--card)',
    border: 'var(--border-sticker)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sticker)',
    cursor: 'pointer',
    textAlign: 'left'
  },
  alleGlyph: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent)',
    color: 'var(--foreground)',
    border: '2px solid var(--foreground)'
  },
  folderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '13px 16px',
    background: 'var(--card)',
    border: 'none',
    cursor: 'pointer'
  },
  folderRowGlyph: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--foreground)'
  },
  folderRowTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 16,
    color: 'var(--text-strong)',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  folderRowSub: {
    fontSize: 12.5,
    color: 'var(--text-muted)',
    marginTop: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  folderCount: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--text-soft)',
    fontFamily: 'var(--font-mono)',
    minWidth: 22,
    textAlign: 'right'
  },
  egenTag: {
    fontSize: 9.5,
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: 'var(--primary)',
    background: 'var(--primary-bg)',
    border: '1.5px solid color-mix(in srgb, var(--primary) 28%, transparent)',
    borderRadius: 999,
    padding: '1px 6px'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    padding: '8px 14px 8px 10px',
    background: 'var(--card)',
    border: 'var(--border-sticker)',
    borderRadius: 'var(--radius-full)',
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    color: 'var(--text)',
    boxShadow: 'var(--shadow-sticker-sm)',
    fontFamily: 'var(--font-sans)'
  },
  folderHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginTop: 16
  },
  folderHeadGlyph: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 58,
    flexShrink: 0,
    borderRadius: 16,
    border: '2px solid var(--foreground)'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    background: 'var(--card)'
  },
  rowGlyph: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--foreground)'
  },
  rowTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1.1,
    color: 'var(--text-strong)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: 7
  },
  rowDesc: {
    fontSize: 12.5,
    color: 'var(--text-muted)',
    lineHeight: 1.35,
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  rowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
    flexWrap: 'wrap'
  },
  social: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    fontWeight: 600
  },
  addedBy: {
    fontSize: 11.5,
    color: 'var(--primary)',
    fontWeight: 700
  },
  miniBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: '0.02em',
    color: 'var(--text-muted)',
    border: '1.5px solid var(--line-strong)',
    borderRadius: 999,
    padding: '2px 7px',
    textTransform: 'uppercase'
  },
  toggle: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: '50%',
    border: '2px solid var(--foreground)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sticker-sm)'
  },
  packGlyph: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 14,
    background: 'var(--accent)',
    color: 'var(--foreground)',
    border: '2px solid var(--foreground)',
    flexShrink: 0
  },
  scrim: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(20,26,48,0.42)',
    zIndex: 30,
    display: 'flex',
    alignItems: 'flex-end',
    backdropFilter: 'blur(2px)'
  },
  sheet: {
    width: '100%',
    background: 'var(--card)',
    borderTopLeftRadius: 'var(--radius-xl)',
    borderTopRightRadius: 'var(--radius-xl)',
    borderTop: '2px solid var(--foreground)',
    padding: '12px 18px 26px',
    maxHeight: '90%',
    overflowY: 'auto',
    boxShadow: '0 -10px 40px rgba(20,26,48,0.25)'
  },
  sheetGrab: {
    width: 42,
    height: 5,
    borderRadius: 999,
    background: 'var(--line-strong)',
    opacity: 0.3,
    margin: '0 auto 14px'
  },
  sheetGlyph: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 58,
    borderRadius: 16,
    border: '2px solid var(--foreground)',
    flexShrink: 0
  },
  sheetX: {
    border: '1.5px solid var(--line)',
    background: 'var(--surface-soft)',
    borderRadius: '50%',
    width: 32,
    height: 32,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    color: 'var(--text)',
    flexShrink: 0
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginTop: 16
  },
  metaCell: {
    border: '1.5px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    padding: '11px 13px',
    background: 'var(--surface-soft)'
  },
  metaLabel: {
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)'
  },
  metaValue: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 17,
    color: 'var(--text-strong)',
    marginTop: 3
  },
  socialBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginTop: 14,
    padding: '11px 13px',
    background: 'var(--primary-bg)',
    border: '1.5px solid color-mix(in srgb, var(--primary) 22%, transparent)',
    borderRadius: 'var(--radius-md)',
    fontSize: 13.5,
    color: 'var(--text)'
  },
  addedNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    fontSize: 13,
    color: 'var(--text-soft)'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: 'var(--border-sticker)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    fontSize: 15,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text)',
    background: 'var(--card)',
    outline: 'none'
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 6
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 7
  },
  iconChoice: {
    aspectRatio: '1',
    display: 'grid',
    placeItems: 'center',
    borderRadius: 'var(--radius-md)',
    border: 'var(--border-sticker)',
    cursor: 'pointer'
  },
  nav: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    height: 66,
    background: 'color-mix(in srgb, var(--card) 88%, transparent)',
    backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-full)',
    border: '2px solid var(--foreground)',
    boxShadow: 'var(--shadow-sticker)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 8px',
    zIndex: 20
  },
  navBtn: {
    border: 'none',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    padding: 0,
    width: 58
  },
  navIcon: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: 40,
    height: 30,
    borderRadius: 999,
    transition: 'all 0.14s'
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: 2,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 999,
    background: 'var(--accent)',
    color: 'var(--foreground)',
    fontSize: 10,
    fontWeight: 800,
    display: 'grid',
    placeItems: 'center',
    border: '1.5px solid var(--foreground)'
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 700
  },
  toast: {
    position: 'absolute',
    left: '50%',
    bottom: 92,
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    color: 'var(--card)',
    background: 'var(--foreground)',
    padding: '12px 18px',
    borderRadius: 'var(--radius-full)',
    fontSize: 14,
    fontWeight: 700,
    zIndex: 40,
    whiteSpace: 'nowrap',
    border: '2px solid var(--foreground)'
  },
  tweakFab: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    width: 46,
    height: 46,
    borderRadius: '50%',
    background: 'var(--card)',
    border: '2px solid var(--foreground)',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    zIndex: 25,
    color: 'var(--text)',
    boxShadow: 'var(--shadow-sticker)'
  },
  tweakPanel: {
    position: 'absolute',
    right: 16,
    bottom: 148,
    width: 268,
    background: 'var(--card)',
    border: '2px solid var(--foreground)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    zIndex: 26,
    boxShadow: 'var(--shadow-sticker-lg)'
  },
  miniSeg: {
    display: 'flex',
    gap: 3,
    background: 'var(--surface-soft)',
    borderRadius: 999,
    padding: 3,
    border: '1.5px solid var(--line)'
  },
  miniSegBtn: {
    border: 'none',
    background: 'transparent',
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-sans)'
  },
  switch: {
    width: 46,
    height: 27,
    borderRadius: 999,
    border: '2px solid var(--foreground)',
    display: 'flex',
    alignItems: 'center',
    padding: 2,
    cursor: 'pointer',
    flexShrink: 0
  },
  switchKnob: {
    width: 19,
    height: 19,
    borderRadius: '50%',
    background: 'var(--card)',
    border: '1.5px solid var(--foreground)'
  }
};
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/knutebibliotek/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/knutebibliotek/data.js
try { (() => {
/* Knutebibliotek — katalog-seed (utdrag fra Stavanger-russens knutebok + et par
   tematiske mapper). Ekte navn/poeng fra docs/library-seed-source.md.
   Modell: hver knute har ÉN hjemmemappe. "Alle knuter" er virtuell (driver søk).
   Eksponeres som window.KB. */
(function () {
  // Mappene i biblioteket (TYPE/tema). "Alle" er virtuell og finnes alltid.
  // g = glyf: {t:'brand'} bruker KnoteIcon, {t:'lucide'} bruker inline-ikon.
  const FOLDERS = [{
    key: 'Generelle',
    label: 'Generelle',
    g: {
      t: 'brand',
      n: 'generelle'
    }
  }, {
    key: 'Dobbel',
    label: 'Dobbel',
    g: {
      t: 'brand',
      n: 'dobbel'
    },
    note: 'Teller som 2 mot tråd-knutene'
  }, {
    key: 'Rampestrek',
    label: 'Rampestrek',
    g: {
      t: 'brand',
      n: 'fordervett'
    }
  }, {
    key: 'Sport',
    label: 'Sport',
    g: {
      t: 'lucide',
      n: 'Dumbbell'
    }
  }, {
    key: 'Mat',
    label: 'Mat',
    g: {
      t: 'lucide',
      n: 'Utensils'
    }
  }, {
    key: 'Alkohol',
    label: 'Alkohol',
    g: {
      t: 'brand',
      n: 'alkohol'
    },
    sensitive: true
  }, {
    key: 'Sex',
    label: 'Sex',
    g: {
      t: 'brand',
      n: 'sex'
    },
    sensitive: true
  }];
  const ALLE = {
    key: 'Alle',
    label: 'Alle knuter',
    g: {
      t: 'lucide',
      n: 'LibraryBig'
    },
    virtual: true
  };
  function diff(points) {
    if (points <= 0) return 'Valgfri';
    if (points < 20) return 'Lett';
    if (points <= 45) return 'Medium';
    return 'Hard';
  }

  // id, name, points, desc, folder, evidence('media'|'text'), age(17|18),
  // schools(bruk), pack(Anbefalt starter), added(i knuteboka), addedBy(medknutesjef|null)
  const RAW = [
  // ---- Generelle ----
  ['bi', 'BI', 28, 'Vipps økonomisjefen i russestyret 10 kr.', 'Generelle', 'media', 17, 124, true, true, null], ['romeo', 'Romeo', 10, 'Skriv et romantisk dikt til loveboss og les det opp.', 'Generelle', 'media', 17, 98, true, true, null], ['bikkja', 'Bikkjå', 10, 'Bjeff høyt minst 10 ganger i løpet av én skoletime.', 'Generelle', 'media', 17, 110, true, true, null], ['lattis', 'Lættis Alarm', 12, 'Få en knutesjef til å le høyt.', 'Generelle', 'media', 17, 87, true, false, null], ['jafs', 'Jafs', 13, 'Spis en hel cheeseburger i én jafs.', 'Generelle', 'media', 17, 76, true, false, null], ['klam', 'Klam', 15, 'Gjennomfør en hel kroppsøvingstime iført russedress.', 'Generelle', 'media', 17, 64, true, false, null], ['rim', 'Rim', 45, 'Hold en hel presentasjon på rim.', 'Generelle', 'media', 17, 52, false, false, null], ['mukbang', 'Mukbang', 83, 'Spis 54 nuggets i løpet av én studietime.', 'Generelle', 'media', 17, 19, false, false, null],
  // ---- Dobbel ----
  ['bronsetrad', 'Bronsetråd', 25, 'Gjennomfør 5 knuter innen 24 timer.', 'Dobbel', 'media', 17, 90, true, true, 'Turbo-Jonas'], ['skuespill', 'Skuespill', 25, 'Fremfør et skuespill i kantina i minst 5 minutter.', 'Dobbel', 'media', 17, 58, true, true, 'Turbo-Jonas'], ['singalong', 'Sing a Long', 25, 'Start allsang i kantina.', 'Dobbel', 'media', 17, 71, true, false, null], ['komikeren', 'Komikeren', 40, 'Hold standup i kantina og få minst 5 latere.', 'Dobbel', 'media', 17, 44, false, false, null], ['solvtrad', 'Sølvtråd', 45, 'Gjennomfør 15 knuter innen 24 timer.', 'Dobbel', 'media', 17, 49, false, false, null], ['flyplass', 'Flyplass', 65, 'Bruk en koffert som skolesekk en hel uke.', 'Dobbel', 'media', 17, 28, false, false, null], ['gulltrad', 'Gulltråd', 80, 'Gjennomfør 40 knuter innen 24 timer.', 'Dobbel', 'media', 17, 22, false, false, null, true],
  // ---- Rampestrek ----
  ['unoreverse', 'Uno Reverse', 10, 'Få et russekort av en unge, i stedet for å gi bort ditt.', 'Rampestrek', 'media', 17, 95, true, true, null], ['plukkopp', 'Plukk opp!', 12, 'Rydd i kantina, eller hjelp til etter russedåpen.', 'Rampestrek', 'media', 17, 80, true, true, null], ['baka', 'Baka', 15, 'Rop «baka» for full hals i kantina.', 'Rampestrek', 'media', 17, 67, true, false, null], ['vrangen', 'Vrangen', 22, 'Gå med alle klærne på vrangen en hel skoledag.', 'Rampestrek', 'media', 17, 54, false, false, null], ['diktatoren', 'Diktatoren', 25, 'Stå køvakt i kantina iført refleksvest og briller.', 'Rampestrek', 'media', 17, 48, false, false, null], ['footlong', 'Footlong', 25, 'Bruk brød som sko en hel skoledag.', 'Rampestrek', 'media', 17, 39, false, false, null], ['ikea', 'Ikea', 45, 'Lek «hjemmeleken» på IKEA med minst 10 personer.', 'Rampestrek', 'media', 17, 31, false, false, null], ['olsenbanden', 'Olsenbanden', 50, 'Finn på en rampestrek og vis den til en knutesjef.', 'Rampestrek', 'media', 17, 26, false, false, null],
  // ---- Sport (tematisk eksempel-mappe) ----
  ['planken', 'Planken', 15, 'Hold planken i 3 minutter midt i kantina.', 'Sport', 'media', 17, 40, false, false, null], ['stigeroret', 'Stigerøret', 20, 'Ta 50 push-ups på rad uten pause.', 'Sport', 'media', 17, 33, false, false, null], ['maraton', 'Maraton', 45, 'Løp 10 km i full russedress.', 'Sport', 'media', 17, 17, false, false, null], ['svommetur', 'Svømmetur', 22, 'Ta en kald morgendukkert før skolen.', 'Sport', 'media', 17, 28, false, false, null],
  // ---- Mat (tematisk eksempel-mappe) ----
  ['pizzakongen', 'Pizzakongen', 18, 'Spis en hel pizza alene på 15 minutter.', 'Mat', 'media', 17, 38, false, false, null], ['sterk', 'Sterk', 22, 'Spis en hel chili uten å drikke noe etterpå.', 'Mat', 'media', 17, 30, false, false, null], ['frokostmester', 'Frokostmester', 12, 'Lag og server frokost til hele slepet.', 'Mat', 'media', 17, 24, false, false, null],
  // ---- Alkohol (sensitivt) ----
  ['beerpong', 'Beerpong', 25, 'Arranger en beerpong-turnering i et friminutt eller en matpause.', 'Alkohol', 'media', 17, 36, false, true, null], ['nydag', 'Ny Dag', 12, 'Start dagen med en enhet i frokostblandingen.', 'Alkohol', 'media', 17, 18, false, false, null], ['skal', 'Skål', 67, 'Tilby en i russestyret en enhet i skoletiden.', 'Alkohol', 'media', 17, 12, false, false, null],
  // ---- Sex (18+, tekst-bevis) ----
  ['solibat', 'Sølibat', 0, 'Ikke ha sex gjennom hele russetiden.', 'Sex', 'text', 18, 30, false, false, null], ['festival', 'Festival', 55, 'Ha frivillig sex på Vaulen, med samtykke.', 'Sex', 'text', 18, 11, false, false, null], ['firstlady', 'FirstLady', 55, 'Ha frivillig sex med russepresidenten, med samtykke.', 'Sex', 'text', 18, 8, false, false, null], ['kongla', 'Konglå', 70, 'Ha frivillig sex utendørs, med samtykke.', 'Sex', 'text', 18, 7, false, false, null]];
  const FMETA = {};
  FOLDERS.forEach(f => {
    FMETA[f.key] = f;
  });
  const KNUTER = RAW.map(function (r) {
    const folder = r[4];
    const meta = FMETA[folder] || {};
    return {
      id: r[0],
      name: r[1],
      points: r[2],
      desc: r[3],
      folder: folder,
      evidence: r[5],
      age: r[6],
      schools: r[7],
      pack: r[8],
      added: r[9],
      addedBy: r[10] || null,
      gold: r[11] || false,
      difficulty: diff(r[2]),
      sensitive: !!meta.sensitive,
      custom: false
    };
  });
  window.KB = {
    FOLDERS,
    ALLE,
    FMETA,
    KNUTER,
    diff,
    SCHOOL: {
      name: 'St. Olav VGS',
      russenavn: 'Emma',
      co: 'Turbo-Jonas'
    },
    PACK: {
      name: 'Anbefalt starter',
      desc: 'Ludvig sin standardpakke — trygge knuter å åpne kullet med.'
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/knutebibliotek/data.js", error: String((e && e.message) || e) }); }

// ui_kits/knuteloop-app/app.jsx
try { (() => {
// Knuteloop UI kit — phone shell, tab bar, router & flow state.
(function () {
  const DS = window.KnuteloopDesignSystem_89dd9e;
  const Icon = window.KNL_Icon;
  const S = window.KNL_SCREENS;
  const {
    useState
  } = React;
  const TABS = [{
    id: 'feed',
    label: 'Hjem',
    icon: 'home'
  }, {
    id: 'knuter',
    label: 'Knuter',
    icon: 'grid'
  }, {
    id: 'toppliste',
    label: 'Topp',
    icon: 'trophy'
  }, {
    id: 'profil',
    label: 'Profil',
    icon: 'user'
  }];
  function StatusBar({
    dark
  }) {
    const c = dark ? '#fff' : 'var(--foreground)';
    return React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px 4px',
        color: c,
        fontWeight: 700,
        fontSize: 14,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0
      }
    }, React.createElement('span', null, '9:41'), React.createElement('span', {
      style: {
        display: 'inline-flex',
        gap: 6,
        alignItems: 'center'
      }
    }, React.createElement('span', {
      style: {
        width: 17,
        height: 11,
        border: '1.5px solid ' + c,
        borderRadius: 3,
        display: 'inline-block',
        position: 'relative'
      }
    }, React.createElement('span', {
      style: {
        position: 'absolute',
        inset: 1.5,
        background: c,
        borderRadius: 1
      }
    }))));
  }
  function App() {
    const [phase, setPhase] = useState('onboarding');
    const [tab, setTab] = useState('feed');
    const [overlay, setOverlay] = useState(null); // 'submit' | 'admin'
    const [celebrate, setCelebrate] = useState(false);
    const [feedVariant, setFeedVariant] = useState('rich');

    // expose a tiny control for the demo toolbar (feed variation tweak)
    window.__knlSetFeedVariant = setFeedVariant;
    window.__knlGetFeedVariant = () => feedVariant;
    const onboarding = phase === 'onboarding';
    let content;
    if (onboarding) {
      content = React.createElement(S.OnboardingScreen, {
        onDone: () => setPhase('app')
      });
    } else if (tab === 'feed') content = React.createElement(S.FeedScreen, {
      variant: feedVariant
    });else if (tab === 'knuter') content = React.createElement(S.KnuterScreen);else if (tab === 'toppliste') content = React.createElement(S.LeaderboardScreen);else if (tab === 'profil') content = React.createElement(S.ProfileScreen, {
      onAdmin: () => setOverlay('admin')
    });
    return React.createElement('div', {
      className: 'knl-phone'
    }, React.createElement(StatusBar, {
      dark: onboarding && true && false
    }), React.createElement('div', {
      className: 'knl-viewport',
      key: phase + tab
    }, content, overlay === 'submit' ? React.createElement('div', {
      className: 'knl-sheet'
    }, React.createElement(S.SubmitScreen, {
      onClose: () => setOverlay(null),
      onSubmitted: () => {
        setOverlay(null);
        setCelebrate(true);
      }
    })) : null, overlay === 'admin' ? React.createElement('div', {
      className: 'knl-sheet'
    }, React.createElement(S.AdminScreen, {
      onBack: () => setOverlay(null)
    })) : null, celebrate ? React.createElement(S.Celebration, {
      onClose: () => setCelebrate(false)
    }) : null), !onboarding ? React.createElement(TabBar, {
      tab,
      setTab,
      onSubmit: () => setOverlay('submit')
    }) : null);
  }
  function TabBar({
    tab,
    setTab,
    onSubmit
  }) {
    return React.createElement('div', {
      className: 'knl-tabbar'
    }, TABS.slice(0, 2).map(t => React.createElement(TabBtn, {
      key: t.id,
      t,
      active: tab === t.id,
      onClick: () => setTab(t.id)
    })), React.createElement('button', {
      onClick: onSubmit,
      'aria-label': 'Send inn',
      className: 'sticker',
      style: {
        width: 56,
        height: 56,
        borderRadius: 999,
        background: 'var(--accent)',
        color: 'var(--accent-foreground)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        marginTop: -22,
        flexShrink: 0
      }
    }, React.createElement(Icon, {
      name: 'plus',
      size: 28,
      strokeWidth: 2.6
    })), TABS.slice(2).map(t => React.createElement(TabBtn, {
      key: t.id,
      t,
      active: tab === t.id,
      onClick: () => setTab(t.id)
    })));
  }
  function TabBtn({
    t,
    active,
    onClick
  }) {
    return React.createElement('button', {
      onClick,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: 700,
        fontSize: 11
      }
    }, React.createElement(Icon, {
      name: t.icon,
      size: 23,
      strokeWidth: active ? 2.4 : 2
    }), t.label);
  }
  ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(App));
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/knuteloop-app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/knuteloop-app/data.js
try { (() => {
// Mock data for the Knuteloop app UI kit — bokmål, lifted from the v1 prototype seed.
window.KNL_DATA = function () {
  const me = {
    russName: 'Sofie Sprint',
    realName: 'Sofie Lunde',
    className: '3STA',
    russType: 'red',
    points: 285,
    rank: 3,
    completed: 15,
    streak: 7,
    bio: 'Knutesjef med full kontroll, rask godkjenning og null ro i russechatten når noe skjer på skolen.',
    quote: 'Full fart, full oversikt, aldri lav energi.',
    school: 'St. Olav vgs'
  };
  const feed = [{
    id: 'f1',
    name: 'Emil Baka',
    russType: 'blue',
    group: '3PBA',
    time: '8 min',
    knute: 'Spis 100 nuggets i en studietime',
    category: 'Generelle',
    points: 20,
    caption: 'Klarte 100 på 38 min. Aldri mer nuggets.',
    likes: 24,
    comments: 5,
    rating: 4.6
  }, {
    id: 'f2',
    name: 'Nora Neon',
    russType: 'red',
    group: '3MKA',
    time: '32 min',
    knute: 'Lag en heiarop-video for klassen',
    category: 'Generelle',
    points: 35,
    caption: 'Hele 3MKA stilte opp 🔊',
    likes: 41,
    comments: 12,
    rating: 4.9
  }, {
    id: 'f3',
    name: 'Jonas Turbo',
    russType: 'blue',
    group: '3IDA',
    time: '1 t',
    knute: 'Superman: undertøy utenpå russedrakten',
    category: 'Fordervett-knuter',
    points: 20,
    caption: 'Gikk en hel dag sånn. Verdt det.',
    likes: 33,
    comments: 8,
    rating: 4.2
  }, {
    id: 'f4',
    name: 'Leah Lyd',
    russType: 'red',
    group: '3STB',
    time: '2 t',
    knute: 'Arranger miniquiz om russetiden',
    category: 'Generelle',
    points: 30,
    caption: 'Fem spørsmål, hele klassen med.',
    likes: 19,
    comments: 3,
    rating: 4.4
  }];
  const knuter = [{
    id: 'k1',
    title: 'Spis frokost under pulten',
    description: 'Start dagen kreativt og hold det low key i første time.',
    category: 'Generelle',
    difficulty: 'Lett',
    points: 10,
    status: 'Tilgjengelig'
  }, {
    id: 'k2',
    title: 'Ta klassebilde med matchende solbriller',
    description: 'Samle gjengen og lever et koordinert bildebevis.',
    category: 'Dobbelknuter',
    difficulty: 'Medium',
    points: 25,
    status: 'Tilgjengelig'
  }, {
    id: 'k3',
    title: 'Spis 100 nuggets i en studietime',
    description: 'Fra St. Olav-listen.',
    category: 'Generelle',
    difficulty: 'Medium',
    points: 20,
    status: 'Godkjent'
  }, {
    id: 'k4',
    title: 'Gå edru hele russetiden',
    description: 'En av de tøffeste — gullknute.',
    category: 'Alkoholknuter',
    difficulty: 'Hard',
    points: 30,
    status: 'Tilgjengelig',
    gold: true
  }, {
    id: 'k5',
    title: 'Lag tinderprofil for noen',
    description: 'Med samtykke, så klart.',
    category: 'Sexknuter',
    difficulty: 'Medium',
    points: 15,
    status: 'Tilgjengelig'
  }, {
    id: 'k6',
    title: 'Frys skoen til noen på fest',
    description: 'Klassisk rampestrek.',
    category: 'Fordervett-knuter',
    difficulty: 'Lett',
    points: 10,
    status: 'Venter'
  }, {
    id: 'k7',
    title: 'Handcuff deg til noen en hel skoledag',
    description: 'Velg partneren din med omhu.',
    category: 'Dobbelknuter',
    difficulty: 'Medium',
    points: 20,
    status: 'Tilgjengelig'
  }, {
    id: 'k8',
    title: 'Hold standup show i kinosal',
    description: '5 min før filmen begynner.',
    category: 'Generelle',
    difficulty: 'Hard',
    points: 30,
    status: 'Tilgjengelig'
  }];
  const folders = [{
    id: 'Generelle',
    label: 'Generelle',
    glyph: 'generelle',
    count: 34,
    desc: 'Vanlige knuter som passer for de fleste.'
  }, {
    id: 'Dobbelknuter',
    label: 'Dobbelknuter',
    glyph: 'dobbel',
    count: 18,
    desc: 'Krever ofte en venn eller en gruppe.'
  }, {
    id: 'Alkoholknuter',
    label: 'Alkoholknuter',
    glyph: 'alkohol',
    count: 12,
    desc: 'Knyttet til drikking eller edruvalg.'
  }, {
    id: 'Sexknuter',
    label: 'Sexknuter',
    glyph: 'sex',
    count: 9,
    desc: 'Florting, kropp eller dating som tema.'
  }, {
    id: 'Fordervett-knuter',
    label: 'Fordervett',
    glyph: 'fordervett',
    count: 7,
    desc: 'Trenger ekstra vurdering og dømmekraft.'
  }];
  const leaders = [{
    rank: 1,
    name: 'Emil Baka',
    group: '3PBA',
    points: 315,
    russType: 'blue'
  }, {
    rank: 2,
    name: 'Nora Neon',
    group: '3MKA',
    points: 300,
    russType: 'red'
  }, {
    rank: 3,
    name: 'Sofie Sprint',
    group: '3STA',
    points: 285,
    russType: 'red',
    me: true
  }, {
    rank: 4,
    name: 'Jonas Turbo',
    group: '3IDA',
    points: 275,
    russType: 'blue'
  }, {
    rank: 5,
    name: 'Leah Lyd',
    group: '3STB',
    points: 260,
    russType: 'red'
  }, {
    rank: 6,
    name: 'Mads Maks',
    group: '3PBA',
    points: 240,
    russType: 'blue'
  }, {
    rank: 7,
    name: 'Ida Iskald',
    group: '3STA',
    points: 228,
    russType: 'red'
  }];
  const queue = [{
    id: 'q1',
    name: 'Emil Baka',
    russType: 'blue',
    knute: 'Spis 100 nuggets i en studietime',
    points: 20,
    time: 'I dag 08:42'
  }, {
    id: 'q2',
    name: 'Leah Lyd',
    russType: 'red',
    knute: 'Arranger miniquiz om russetiden',
    points: 30,
    time: 'I dag 09:15'
  }, {
    id: 'q3',
    name: 'Mads Maks',
    russType: 'blue',
    knute: 'Frys skoen til noen på fest',
    points: 10,
    time: 'I går 22:03'
  }];
  const badges = [{
    key: 'total',
    name: 'Knutesamler',
    glyph: 'knute',
    tier: 'gull',
    value: 15,
    max: 15
  }, {
    key: 'points',
    name: 'Poengjager',
    glyph: 'generelle',
    tier: 'sølv',
    value: 285,
    max: 350
  }, {
    key: 'social',
    name: 'Sosial motor',
    glyph: 'dobbel',
    tier: 'sølv',
    value: 7,
    max: 10
  }, {
    key: 'party',
    name: 'Festpuls',
    glyph: 'alkohol',
    tier: 'bronze',
    value: 2,
    max: 4
  }, {
    key: 'gold',
    name: 'Gullknute-jeger',
    glyph: 'sex',
    tier: 'bronze',
    value: 0,
    max: 1,
    locked: true
  }, {
    key: 'school',
    name: 'Skolekaos',
    glyph: 'fordervett',
    tier: 'bronze',
    value: 1,
    max: 3
  }];
  const schools = ['St. Olav vgs', 'Kongsbakken vgs', 'Kannik skole', 'Tromsdalen vgs', 'Bergen Katedralskole'];
  return {
    me,
    feed,
    knuter,
    folders,
    leaders,
    queue,
    badges,
    schools
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/knuteloop-app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/knuteloop-app/icons.jsx
try { (() => {
// Clean Lucide-style icon set (inline, MIT paths) for the Knuteloop UI kit.
// Exported to window.KNL_Icon. Color via currentColor, size via `size` prop.
(function () {
  const P = {
    home: '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.2"/>',
    trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3"/><path d="M17 6h3v2a3 3 0 0 1-3 3"/><path d="M9.5 13.5h5L14 18h-4Z"/><path d="M8 21h8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="M5 12.5 10 17.5 19.5 6.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chevronRight: '<path d="m9 5 7 7-7 7"/>',
    chevronLeft: '<path d="m15 5-7 7 7 7"/>',
    chevronDown: '<path d="m5 9 7 7 7-7"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.2A1.7 1.7 0 0 0 7 19.6a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 0 1 0-4h.2A1.7 1.7 0 0 0 2.4 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 7 2.4h.1A1.7 1.7 0 0 0 8.2 1H8a2 2 0 0 1 4 0v.2A1.7 1.7 0 0 0 13.5 2.4a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.1a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.8 1.4Z"/>',
    share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3"/>',
    heart: '<path d="M12 20s-7-4.6-9.3-9C1 7.5 3 4.5 6 4.5c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3 0 5 3 3.3 6.5C19 15.4 12 20 12 20Z"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z"/>',
    star: '<path d="m12 3 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.9 6.7 19.3l1.1-5.9L3.4 9.3l6-.8Z"/>',
    mapPin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    shield: '<path d="M12 3 5 6v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10V6Z"/>',
    sparkles: '<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z"/><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    flame: '<path d="M12 3c1 4-2 5-2 8a3 3 0 0 0 6 0c0-1-.5-2-1-2.5C16 11 17 13 17 15a5 5 0 0 1-10 0c0-3.5 3-5 5-12Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4Z"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    vipps: '' // wordmark drawn separately
  };
  function Icon({
    name,
    size = 22,
    strokeWidth = 2,
    style,
    ...rest
  }) {
    return React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      style,
      dangerouslySetInnerHTML: {
        __html: P[name] || ''
      },
      ...rest
    });
  }
  window.KNL_Icon = Icon;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/knuteloop-app/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/knuteloop-app/screens-flow.jsx
try { (() => {
// Knuteloop UI kit — flow screens: Onboarding/Login, Send inn, Knutesjef, Celebration.
(function () {
  const DS = window.KnuteloopDesignSystem_89dd9e;
  const {
    Button,
    Chip,
    StickerCard,
    Avatar,
    ProgressBar,
    KnoteIcon,
    KnoteLogo,
    KnuteCard
  } = DS;
  const Icon = window.KNL_Icon;
  const D = window.KNL_DATA;
  const {
    useState
  } = React;
  const Photo = () => window.KNL_SCREENS.Photo;

  // ---------------- ONBOARDING / LOGIN ----------------
  function OnboardingScreen({
    onDone
  }) {
    const [step, setStep] = useState(0); // 0 welcome, 1 school, 2 vipps, 3 russenavn
    const [school, setSchool] = useState(null);
    const [claimed, setClaimed] = useState(null);
    const next = () => setStep(s => s + 1);
    const Frame = ({
      children,
      footer
    }) => React.createElement('div', {
      style: {
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 22px',
        background: step === 0 ? 'var(--primary)' : 'var(--bg)'
      }
    }, step > 0 ? React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18
      }
    }, React.createElement('button', {
      onClick: () => setStep(s => s - 1),
      style: {
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        color: 'var(--foreground)',
        display: 'grid',
        placeItems: 'center'
      }
    }, React.createElement(Icon, {
      name: 'arrowLeft',
      size: 22
    })), React.createElement(ProgressBar, {
      value: step,
      max: 3,
      tone: 'primary',
      style: {
        flex: 1
      }
    })) : null, React.createElement('div', {
      style: {
        flex: 1
      }
    }, children), footer);
    if (step === 0) return React.createElement(Frame, {
      footer: React.createElement(Button, {
        variant: 'accent',
        size: 'lg',
        fullWidth: true,
        onClick: next
      }, 'Kom i gang')
    }, React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        gap: 20,
        color: '#fff'
      }
    }, React.createElement('div', {
      style: {
        color: '#fff'
      }
    }, React.createElement(KnoteIcon, {
      name: 'knute',
      size: 120
    })), React.createElement('h1', {
      style: {
        color: '#fff',
        fontSize: '2.6rem',
        lineHeight: 0.95
      }
    }, 'Russetid', React.createElement('br'), 'på loop'), React.createElement('p', {
      style: {
        color: 'rgba(255,255,255,0.85)',
        maxWidth: '26ch',
        fontSize: '1.02rem'
      }
    }, 'Fullfør knuter, last opp beviset, og klatre på topplista med klassen din.')));
    if (step === 1) return React.createElement(Frame, {
      footer: React.createElement(Button, {
        variant: 'primary',
        size: 'lg',
        fullWidth: true,
        disabled: !school,
        onClick: next
      }, 'Fortsett')
    }, React.createElement('h2', {
      style: {
        fontSize: '1.8rem',
        marginBottom: 6
      }
    }, 'Velg skolen din'), React.createElement('p', {
      style: {
        marginBottom: 18
      }
    }, 'Topplista og knutene er knyttet til skolen din.'), React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, D.schools.map(s => React.createElement('button', {
      key: s,
      onClick: () => setSchool(s),
      className: 'sticker',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        background: school === s ? 'var(--accent-bg)' : 'var(--card)',
        color: 'var(--foreground)',
        fontWeight: 700,
        fontSize: '0.95rem'
      }
    }, React.createElement(Icon, {
      name: 'mapPin',
      size: 18,
      style: {
        color: 'var(--primary)'
      }
    }), React.createElement('span', {
      style: {
        flex: 1
      }
    }, s), school === s ? React.createElement(Icon, {
      name: 'check',
      size: 20,
      style: {
        color: 'var(--success)'
      }
    }) : null))));
    if (step === 2) return React.createElement(Frame, {
      footer: null
    }, React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        gap: 20
      }
    }, React.createElement(Avatar, {
      name: 'Ny Russ',
      size: 76,
      ring: 'blue'
    }), React.createElement('h2', {
      style: {
        fontSize: '1.7rem'
      }
    }, 'Logg inn'), React.createElement('p', {
      style: {
        maxWidth: '26ch'
      }
    }, 'Vi bruker Vipps for å bekrefte at du er deg. Trygt og raskt.'), React.createElement('button', {
      onClick: next,
      className: 'sticker',
      style: {
        width: '100%',
        height: 56,
        borderRadius: 999,
        background: '#ff5b24',
        color: '#fff',
        border: 'var(--border-sticker)',
        fontWeight: 800,
        fontSize: '1.05rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
      }
    }, React.createElement('span', {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '1.2rem'
      }
    }, 'Vipps'), '· Logg inn'), React.createElement('button', {
      onClick: next,
      style: {
        border: 0,
        background: 'transparent',
        color: 'var(--text-muted)',
        fontWeight: 700,
        cursor: 'pointer',
        textDecoration: 'underline'
      }
    }, 'Logg inn med Apple')));

    // step 3 — claim russenavn
    const names = ['Sofie Sprint', 'Sofie Storm', 'Sprinter\'n'];
    return React.createElement(Frame, {
      footer: React.createElement(Button, {
        variant: 'accent',
        size: 'lg',
        fullWidth: true,
        disabled: !claimed,
        onClick: onDone
      }, 'Inn i appen')
    }, React.createElement('h2', {
      style: {
        fontSize: '1.8rem',
        marginBottom: 6
      }
    }, 'Ditt russenavn'), React.createElement('p', {
      style: {
        marginBottom: 18
      }
    }, 'Knutesjefen har tildelt deg et russenavn. Bekreft det som er ditt.'), React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, names.map(n => React.createElement('button', {
      key: n,
      onClick: () => setClaimed(n),
      className: 'sticker',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        background: claimed === n ? 'var(--accent-bg)' : 'var(--card)',
        color: 'var(--foreground)',
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontSize: '1.05rem'
      }
    }, React.createElement(Avatar, {
      name: n,
      size: 36,
      ring: 'red'
    }), React.createElement('span', {
      style: {
        flex: 1
      }
    }, n), claimed === n ? React.createElement(Icon, {
      name: 'check',
      size: 20,
      style: {
        color: 'var(--success)'
      }
    }) : null))));
  }

  // ---------------- SEND INN (SUBMIT) ----------------
  function SubmitScreen({
    onClose,
    onSubmitted
  }) {
    const [knute, setKnute] = useState(D.knuter[3]);
    const [picked, setPicked] = useState(false);
    return React.createElement('div', {
      style: {
        padding: '8px 16px 16px',
        minHeight: '100%'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
      }
    }, React.createElement('button', {
      onClick: onClose,
      style: {
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        color: 'var(--foreground)',
        display: 'grid',
        placeItems: 'center'
      }
    }, React.createElement(Icon, {
      name: 'x',
      size: 24
    })), React.createElement('div', {
      style: {
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem'
      }
    }, 'Send inn knute'), React.createElement('span', {
      style: {
        width: 24
      }
    })), React.createElement('div', {
      className: 'eyebrow',
      style: {
        margin: '0 0 8px'
      }
    }, 'Valgt knute'), React.createElement(KnuteCard, {
      title: knute.title,
      description: knute.description,
      category: knute.category,
      difficulty: knute.difficulty,
      points: knute.points,
      status: 'Tilgjengelig',
      gold: knute.gold
    }), React.createElement('div', {
      className: 'eyebrow',
      style: {
        margin: '16px 0 8px'
      }
    }, 'Bevis'), picked ? React.createElement('div', {
      style: {
        position: 'relative'
      }
    }, React.createElement('div', {
      style: {
        height: 220,
        borderRadius: 'var(--radius-md)',
        border: 'var(--border-sticker)',
        background: 'linear-gradient(135deg, #2b3a55, #11203a)',
        display: 'grid',
        placeItems: 'center',
        color: 'rgba(255,255,255,0.9)'
      }
    }, React.createElement(Icon, {
      name: 'image',
      size: 40
    })), React.createElement('button', {
      onClick: () => setPicked(false),
      style: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        borderRadius: 999,
        border: 'var(--border-sticker)',
        background: 'var(--card)',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center'
      }
    }, React.createElement(Icon, {
      name: 'x',
      size: 18
    }))) : React.createElement('button', {
      onClick: () => setPicked(true),
      className: 'sticker',
      style: {
        width: '100%',
        height: 220,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-soft)',
        border: '2px dashed var(--line-strong)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: 'var(--primary)'
      }
    }, React.createElement(Icon, {
      name: 'camera',
      size: 40
    }), React.createElement('span', {
      style: {
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontSize: '1.05rem',
        color: 'var(--foreground)'
      }
    }, 'Ta eller velg bilde')), React.createElement('textarea', {
      placeholder: 'Skriv en kort tekst… (valgfritt)',
      rows: 3,
      style: {
        width: '100%',
        marginTop: 14,
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: 'var(--border-sticker)',
        background: 'var(--card)',
        fontFamily: 'var(--font-sans)',
        resize: 'none',
        boxShadow: 'var(--shadow-sticker-sm)'
      }
    }), React.createElement(Button, {
      variant: 'accent',
      size: 'lg',
      fullWidth: true,
      disabled: !picked,
      onClick: onSubmitted,
      style: {
        marginTop: 16
      },
      iconLeft: React.createElement(Icon, {
        name: 'check',
        size: 20
      })
    }, 'Send til godkjenning'));
  }

  // ---------------- KNUTESJEF (ADMIN QUEUE) ----------------
  function AdminScreen({
    onBack
  }) {
    const [queue, setQueue] = useState(D.queue);
    const act = id => setQueue(q => q.filter(x => x.id !== id));
    return React.createElement('div', {
      style: {
        padding: '8px 16px 16px'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14
      }
    }, React.createElement('button', {
      onClick: onBack,
      style: {
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        color: 'var(--foreground)',
        display: 'grid',
        placeItems: 'center'
      }
    }, React.createElement(Icon, {
      name: 'arrowLeft',
      size: 22
    })), React.createElement('div', null, React.createElement('div', {
      className: 'eyebrow'
    }, 'Knutesjef'), React.createElement('h2', {
      style: {
        fontSize: '1.6rem',
        lineHeight: 1
      }
    }, 'Til godkjenning'))), React.createElement(StickerCard, {
      tone: 'soft',
      padding: 'md',
      style: {
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, React.createElement('span', {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '1.6rem',
        color: 'var(--primary)'
      }
    }, queue.length), React.createElement('span', {
      style: {
        fontWeight: 700,
        color: 'var(--text-soft)'
      }
    }, queue.length === 1 ? 'innsending venter' : 'innsendinger venter')), queue.length === 0 ? React.createElement(StickerCard, {
      style: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }
    }, React.createElement(Icon, {
      name: 'check',
      size: 36,
      style: {
        color: 'var(--success)'
      }
    }), React.createElement('div', {
      style: {
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem'
      }
    }, 'Alt er gjennomgått!'), React.createElement('p', {
      style: {
        fontSize: '0.88rem'
      }
    }, 'Ingen flere innsendinger akkurat nå.')) : React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, queue.map(q => React.createElement(StickerCard, {
      key: q.id,
      padding: 'md'
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10
      }
    }, React.createElement(Avatar, {
      name: q.name,
      ring: q.russType,
      size: 40
    }), React.createElement('div', {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement('div', {
      style: {
        fontWeight: 800,
        fontFamily: 'var(--font-display)'
      }
    }, q.name), React.createElement('div', {
      style: {
        fontSize: '0.74rem',
        color: 'var(--text-muted)',
        fontWeight: 600
      }
    }, q.time)), React.createElement(Chip, {
      tone: 'accent',
      size: 'sm'
    }, '+' + q.points)), React.createElement('div', {
      style: {
        height: 150,
        borderRadius: 'var(--radius-md)',
        border: '2px dashed var(--line-strong)',
        background: 'var(--surface-media)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-muted)',
        marginBottom: 10
      }
    }, React.createElement(Icon, {
      name: 'image',
      size: 28
    })), React.createElement('div', {
      style: {
        fontSize: '0.88rem',
        fontWeight: 600,
        color: 'var(--text)',
        marginBottom: 12
      }
    }, q.knute), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 10
      }
    }, React.createElement(Button, {
      variant: 'destructive',
      size: 'sm',
      onClick: () => act(q.id),
      iconLeft: React.createElement(Icon, {
        name: 'x',
        size: 16
      })
    }, 'Avvis'), React.createElement(Button, {
      variant: 'primary',
      size: 'sm',
      fullWidth: true,
      onClick: () => act(q.id),
      iconLeft: React.createElement(Icon, {
        name: 'check',
        size: 16
      })
    }, 'Godkjenn'))))));
  }

  // ---------------- CELEBRATION OVERLAY ----------------
  function Celebration({
    onClose
  }) {
    return React.createElement('div', {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: 'color-mix(in srgb, var(--russ-navy) 78%, transparent)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        textAlign: 'center',
        gap: 18
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        gap: 6,
        marginBottom: -8
      }
    }, ['var(--accent)', 'var(--russ-red)', '#fff', 'var(--primary)'].map((c, i) => React.createElement('span', {
      key: i,
      style: {
        width: 10,
        height: 10,
        borderRadius: 3,
        background: c,
        animation: 'knlpop 0.5s ' + i * 0.08 + 's both'
      }
    }))), React.createElement(DS.BadgeMedallion, {
      icon: React.createElement(KnoteIcon, {
        name: 'knute',
        size: 30
      }),
      name: 'Knutesamler',
      tier: 'gull',
      caption: '15 knuter',
      size: 110
    }), React.createElement('h2', {
      style: {
        color: '#fff',
        fontSize: '1.9rem',
        lineHeight: 1
      }
    }, 'Godkjent!', React.createElement('br'), '+20 poeng'), React.createElement('p', {
      style: {
        color: 'rgba(255,255,255,0.82)',
        maxWidth: '24ch'
      }
    }, 'Du låste opp Knutesamler i gull og klatret forbi Nora på topplista.'), React.createElement(Button, {
      variant: 'accent',
      size: 'lg',
      onClick: onClose
    }, 'Fortsett'), React.createElement('style', null, '@keyframes knlpop{0%{transform:translateY(8px) scale(0);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}'));
  }
  window.KNL_SCREENS = Object.assign(window.KNL_SCREENS || {}, {
    OnboardingScreen,
    SubmitScreen,
    AdminScreen,
    Celebration
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/knuteloop-app/screens-flow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/knuteloop-app/screens-main.jsx
try { (() => {
// Knuteloop UI kit — main tab screens: Hjem (feed), Knuter, Toppliste, Profil.
(function () {
  const DS = window.KnuteloopDesignSystem_89dd9e;
  const {
    Button,
    Chip,
    StickerCard,
    Avatar,
    StatTile,
    ProgressBar,
    KnoteIcon,
    KnoteLogo,
    KnuteCard,
    LeaderRow,
    BadgeMedallion
  } = DS;
  const Icon = window.KNL_Icon;
  const D = window.KNL_DATA;
  const {
    useState
  } = React;

  // Rank title ladder (lowercase exports aren't on the DS namespace, so keep a local copy).
  function getLeaderboardTitle(rank) {
    if (rank === 1) return "O' Store Knutemester";
    if (rank <= 3) return 'Knutemester';
    if (rank <= 10) return 'Knutebaron';
    if (rank <= 20) return 'Knuteridder';
    if (rank <= 35) return 'Knutesersjant';
    if (rank <= 55) return 'Knuteknekt';
    if (rank <= 80) return 'Knutelærling';
    if (rank <= 110) return 'Knuteamatør';
    if (rank <= 145) return 'Knuteprøvling';
    if (rank <= 185) return 'Knutetabbe';
    if (rank <= 220) return 'Knutenybegynner';
    return 'Knutekatastrofen';
  }
  const ScreenHead = ({
    title,
    sub,
    right
  }) => React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '6px 4px 14px'
    }
  }, React.createElement('div', null, sub && React.createElement('div', {
    className: 'eyebrow',
    style: {
      marginBottom: 2
    }
  }, sub), React.createElement('h2', {
    style: {
      fontSize: '1.7rem',
      lineHeight: 1
    }
  }, title)), right);
  const IconBtn = ({
    name,
    onClick,
    badge
  }) => React.createElement('button', {
    onClick,
    className: 'sticker',
    style: {
      width: 42,
      height: 42,
      borderRadius: 'var(--radius-full)',
      background: 'var(--card)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--foreground)',
      cursor: 'pointer',
      position: 'relative'
    }
  }, React.createElement(Icon, {
    name,
    size: 20
  }), badge ? React.createElement('span', {
    style: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      padding: '0 4px',
      borderRadius: 999,
      background: 'var(--danger)',
      color: '#fff',
      fontSize: 10,
      fontWeight: 800,
      display: 'grid',
      placeItems: 'center',
      border: '2px solid var(--card)'
    }
  }, badge) : null);

  // PHOTO placeholder block (no real photos in the kit)
  const Photo = ({
    label,
    h = 200,
    glyph = 'image'
  }) => React.createElement('div', {
    style: {
      height: h,
      borderRadius: 'var(--radius-md)',
      border: '2px dashed var(--line-strong)',
      background: 'repeating-linear-gradient(45deg, var(--surface-soft), var(--surface-soft) 10px, var(--surface-media) 10px, var(--surface-media) 20px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      color: 'var(--text-muted)'
    }
  }, React.createElement(Icon, {
    name: glyph,
    size: 26
  }), React.createElement('span', {
    style: {
      fontSize: '0.72rem',
      fontWeight: 700
    }
  }, label));

  // ---------------- HJEM (FEED) ----------------
  function FeedScreen({
    variant = 'rich',
    onOpenKnuter
  }) {
    return React.createElement('div', {
      style: {
        padding: '0 16px 16px'
      }
    }, React.createElement('div', {
      style: {
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'var(--bg)',
        paddingTop: 8
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 0 12px'
      }
    }, React.createElement(KnoteLogo, {
      size: 24
    }), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 8
      }
    }, React.createElement('span', {
      className: 'sticker',
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '0 12px',
        height: 42,
        borderRadius: 999,
        background: 'var(--accent)',
        color: 'var(--accent-foreground)',
        fontWeight: 800,
        fontFamily: 'var(--font-mono)'
      }
    }, React.createElement('img', {
      src: '../../assets/icons/streak-flame.svg',
      width: 18,
      alt: ''
    }), '7'), React.createElement(IconBtn, {
      name: 'bell',
      badge: 3
    })))),
    // Dagens knute
    React.createElement(StickerCard, {
      tone: 'primary',
      radius: 'lg',
      style: {
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden'
      }
    }, React.createElement('div', {
      className: 'eyebrow',
      style: {
        color: 'var(--accent)'
      }
    }, 'Dagens knute'), React.createElement('h3', {
      style: {
        color: '#fff',
        margin: '4px 0 8px',
        fontSize: '1.25rem'
      }
    }, 'Spis lunsj utendørs med russebuksa på'), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, React.createElement(Chip, {
      tone: 'accent'
    }, '+20 poeng'), React.createElement('span', {
      style: {
        flex: 1
      }
    }), React.createElement(Button, {
      variant: 'accent',
      size: 'sm'
    }, 'Gjør den'))),
    // Feed
    D.feed.map(p => React.createElement(StickerCard, {
      key: p.id,
      padding: 'md',
      style: {
        marginBottom: 14
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10
      }
    }, React.createElement(Avatar, {
      name: p.name,
      ring: p.russType,
      size: 40
    }), React.createElement('div', {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement('div', {
      style: {
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontSize: '0.98rem',
        color: 'var(--text-strong)'
      }
    }, p.name), React.createElement('div', {
      style: {
        fontSize: '0.74rem',
        color: 'var(--text-muted)',
        fontWeight: 600
      }
    }, p.group + ' · ' + p.time)), React.createElement(Chip, {
      tone: 'success',
      size: 'sm'
    }, 'Godkjent')), variant === 'rich' ? React.createElement(Photo, {
      label: 'Bildebevis',
      h: 190
    }) : null, React.createElement('div', {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        margin: '10px 0'
      }
    }, React.createElement(Chip, {
      tone: 'primary',
      size: 'sm',
      icon: React.createElement(KnoteIcon, {
        name: 'knute',
        size: 12
      })
    }, p.knute), React.createElement(Chip, {
      tone: 'accent',
      size: 'sm'
    }, '+' + p.points)), p.caption ? React.createElement('p', {
      style: {
        fontSize: '0.9rem',
        color: 'var(--text)',
        margin: '2px 0 10px'
      }
    }, p.caption) : null, React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        color: 'var(--text-muted)',
        fontWeight: 700,
        fontSize: '0.82rem'
      }
    }, React.createElement('span', {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }
    }, React.createElement(Icon, {
      name: 'heart',
      size: 18
    }), p.likes), React.createElement('span', {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }
    }, React.createElement(Icon, {
      name: 'message',
      size: 18
    }), p.comments), React.createElement('span', {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--accent-strong)'
      }
    }, React.createElement(Icon, {
      name: 'star',
      size: 18
    }), p.rating), React.createElement('span', {
      style: {
        flex: 1
      }
    }), React.createElement(Icon, {
      name: 'share',
      size: 18
    })))));
  }

  // ---------------- KNUTER (CATALOG) ----------------
  function KnuterScreen() {
    const [folder, setFolder] = useState('Alle');
    const list = folder === 'Alle' ? D.knuter : D.knuter.filter(k => k.category === folder);
    return React.createElement('div', {
      style: {
        padding: '8px 16px 16px'
      }
    }, React.createElement(ScreenHead, {
      sub: D.me.school,
      title: 'Knuter',
      right: React.createElement(IconBtn, {
        name: 'search'
      })
    }), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 12,
        margin: '0 -16px',
        padding: '0 16px 12px'
      }
    }, [{
      id: 'Alle',
      label: 'Alle',
      glyph: 'knute',
      count: D.knuter.length
    }, ...D.folders].map(f => React.createElement('button', {
      key: f.id,
      onClick: () => setFolder(f.id),
      className: 'sticker',
      style: {
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 14px',
        borderRadius: 999,
        cursor: 'pointer',
        background: folder === f.id ? 'var(--primary)' : 'var(--card)',
        color: folder === f.id ? '#fff' : 'var(--foreground)',
        fontWeight: 700,
        fontSize: '0.85rem'
      }
    }, React.createElement(KnoteIcon, {
      name: f.glyph,
      size: 16
    }), f.label, React.createElement('span', {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        opacity: 0.7
      }
    }, f.count)))), React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, list.map(k => React.createElement(KnuteCard, {
      key: k.id,
      title: k.title,
      description: k.description,
      category: k.category,
      difficulty: k.difficulty,
      points: k.points,
      status: k.status,
      gold: k.gold,
      onPress: () => {}
    }))));
  }

  // ---------------- TOPPLISTE ----------------
  function LeaderboardScreen() {
    const [scope, setScope] = useState('Skolen');
    return React.createElement('div', {
      style: {
        padding: '8px 16px 16px'
      }
    }, React.createElement(ScreenHead, {
      sub: D.me.school,
      title: 'Toppliste'
    }), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 6,
        padding: 4,
        background: 'var(--surface-soft)',
        border: 'var(--border-sticker)',
        borderRadius: 999,
        marginBottom: 16
      }
    }, ['Skolen', 'Klassen'].map(s => React.createElement('button', {
      key: s,
      onClick: () => setScope(s),
      style: {
        flex: 1,
        padding: '9px',
        borderRadius: 999,
        border: 0,
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: '0.85rem',
        background: scope === s ? 'var(--primary)' : 'transparent',
        color: scope === s ? '#fff' : 'var(--text-soft)'
      }
    }, s))), React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginBottom: 16
      }
    }, (scope === 'Klassen' ? D.leaders.filter(l => l.group === D.me.className || l.me) : D.leaders).map(l => React.createElement(LeaderRow, {
      key: l.rank,
      rank: l.rank,
      name: l.name,
      group: l.group,
      points: l.points,
      russType: l.russType,
      highlight: l.me
    }))), React.createElement(StickerCard, {
      tone: 'accent',
      padding: 'md',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }
    }, React.createElement('div', {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '1.6rem'
      }
    }, '#3'), React.createElement('div', {
      style: {
        flex: 1
      }
    }, React.createElement('div', {
      style: {
        fontWeight: 800,
        fontFamily: 'var(--font-display)'
      }
    }, getLeaderboardTitle(3)), React.createElement('div', {
      style: {
        fontSize: '0.78rem',
        opacity: 0.75,
        fontWeight: 600
      }
    }, 'Du mangler 15 poeng til 2. plass')), React.createElement('img', {
      src: '../../assets/icons/streak-flame.svg',
      width: 30,
      alt: ''
    })));
  }

  // ---------------- PROFIL ----------------
  function ProfileScreen({
    onAdmin
  }) {
    const m = D.me;
    return React.createElement('div', {
      style: {
        padding: '8px 16px 16px'
      }
    }, React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        marginBottom: 8
      }
    }, React.createElement(IconBtn, {
      name: 'shield',
      onClick: onAdmin
    }), React.createElement(IconBtn, {
      name: 'settings'
    })), React.createElement(StickerCard, {
      tone: 'primary',
      radius: 'xl',
      style: {
        marginBottom: 14,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }
    }, React.createElement(Avatar, {
      name: m.russName,
      ring: 'accent',
      size: 84
    }), React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3
      }
    }, React.createElement('div', {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '1.3rem',
        color: '#fff',
        lineHeight: 1.15,
        whiteSpace: 'nowrap'
      }
    }, m.russName), React.createElement('div', {
      style: {
        color: 'var(--accent)',
        fontWeight: 700,
        fontSize: '0.88rem',
        lineHeight: 1.1
      }
    }, getLeaderboardTitle(m.rank))), React.createElement('div', {
      style: {
        display: 'flex',
        gap: 8
      }
    }, React.createElement(Chip, {
      tone: 'accent',
      size: 'sm'
    }, 'Rødruss'), React.createElement(Chip, {
      tone: 'neutral',
      size: 'sm',
      style: {
        background: 'rgba(255,255,255,0.16)',
        color: '#fff',
        borderColor: 'rgba(255,255,255,0.3)'
      }
    }, m.className))), React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap: 8,
        marginBottom: 16
      }
    }, React.createElement(StatTile, {
      value: m.points,
      label: 'Poeng',
      align: 'center',
      style: {
        minWidth: 0,
        padding: '12px 6px'
      }
    }), React.createElement(StatTile, {
      value: m.completed,
      label: 'Knuter',
      align: 'center',
      style: {
        minWidth: 0,
        padding: '12px 6px'
      }
    }), React.createElement(StatTile, {
      value: '#' + m.rank,
      label: 'Rang',
      align: 'center',
      style: {
        minWidth: 0,
        padding: '12px 6px'
      }
    }), React.createElement(StatTile, {
      value: m.streak,
      label: 'Streak',
      align: 'center',
      tone: 'accent',
      style: {
        minWidth: 0,
        padding: '12px 6px'
      }
    })), React.createElement('div', {
      className: 'eyebrow',
      style: {
        margin: '4px 4px 10px'
      }
    }, 'Merker'), React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3,1fr)',
        gap: 14,
        marginBottom: 16
      }
    }, D.badges.map(b => React.createElement('div', {
      key: b.key,
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, React.createElement(BadgeMedallion, {
      icon: React.createElement(KnoteIcon, {
        name: b.glyph,
        size: 22
      }),
      name: b.name,
      tier: b.tier,
      caption: b.locked ? null : b.value + '/' + b.max,
      locked: b.locked,
      size: 60
    })))), React.createElement(StickerCard, {
      padding: 'md'
    }, React.createElement('div', {
      className: 'eyebrow',
      style: {
        marginBottom: 6
      }
    }, 'Kjent for'), React.createElement('p', {
      style: {
        color: 'var(--text)',
        fontSize: '0.92rem',
        margin: 0
      }
    }, m.bio)));
  }
  window.KNL_SCREENS = Object.assign(window.KNL_SCREENS || {}, {
    FeedScreen,
    KnuterScreen,
    LeaderboardScreen,
    ProfileScreen,
    Photo,
    ScreenHead,
    IconBtn
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/knuteloop-app/screens-main.jsx", error: String((e && e.message) || e) }); }

__ds_ns.KnoteIcon = __ds_scope.KnoteIcon;

__ds_ns.KnoteLogo = __ds_scope.KnoteLogo;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.StickerCard = __ds_scope.StickerCard;

__ds_ns.BadgeMedallion = __ds_scope.BadgeMedallion;

__ds_ns.KnuteCard = __ds_scope.KnuteCard;

__ds_ns.LeaderRow = __ds_scope.LeaderRow;

})();
