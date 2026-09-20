import DOMPurify from 'dompurify';
import React, { useEffect, useMemo, useRef } from 'react';

interface SvgIconProps {
  svg: string;
  width?: number;
  height?: number;
  alt?: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({
  svg,
  width = 20,
  height = 20,
  alt,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  const cleanSvg = useMemo(
    () =>
      DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'style'],
        FORBID_ATTR: [
          'onload',
          'onerror',
          'onclick',
          'onmouseover',
          'onfocus',
          'style',
        ],
        ALLOWED_URI_REGEXP:
          /^(?:(?:data:|\/(?!\/)|#)|[^a-z]|[-a-z+.]+(?:[^-a-z+.:]|$))/i,
      }),
    [svg],
  );

  useEffect(() => {
    const svgEl = containerRef.current?.querySelector('svg');
    if (svgEl) {
      svgEl.setAttribute('width', String(width));
      svgEl.setAttribute('height', String(height));
      svgEl.style.display = 'block';
    }
  }, [cleanSvg, width, height]);

  return (
    <span
      ref={containerRef}
      role="img"
      aria-label={alt}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG is sanitized by DOMPurify before rendering
      dangerouslySetInnerHTML={{ __html: cleanSvg }}
      style={{
        display: 'inline-flex',
        width,
        height,
        overflow: 'hidden',
        verticalAlign: 'middle',
      }}
    />
  );
};

export default SvgIcon;
