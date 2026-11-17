export const InkDefs = () => (
  <svg className="ink-defs" aria-hidden="true" focusable="false">
    <filter id="stamp-ink" x="-6%" y="-12%" width="112%" height="124%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.9"
        numOctaves="2"
        seed="11"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="1.7"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
)
