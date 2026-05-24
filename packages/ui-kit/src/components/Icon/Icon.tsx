import type { AriaRole, CSSProperties } from 'react';
import { buildClassName } from '../../util/buildClassName.js';

type OwnProps = {
  name: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  role?: AriaRole;
  ariaLabel?: string;
  ref?: React.RefObject<HTMLElement>;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  iconPrefix?: string;
};

/*
 * The icon font (paapeli-font) is COLRv0. Its CPAL palette entries are
 * hardcoded colors that ignore the CSS `color` property. The only reliable
 * cross-browser way to change the glyph color at runtime is to inject an
 * @font-palette-values rule that overrides palette index 0 to the desired
 * color, then point font-palette at that rule on the element.
 *
 * React 19 deduplicates <style> elements by `href`, so rendering many icons
 * with the same color only inserts one <style> tag.
 */
function toPaletteId(color: string): string {
  return `--pi-${color.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase()}`;
}

const Icon = ({
  name,
  color,
  ref,
  className,
  style,
  role,
  ariaLabel,
  onClick,
  iconPrefix = 'icon',
}: OwnProps) => {
  const paletteId = color ? toPaletteId(color) : undefined;

  return (
    <>
      {color && paletteId && (
        <style href={`paapeli-icon${paletteId}`} precedence="medium">
          {`@font-palette-values ${paletteId}{font-family:"Untitled";base-palette:0;override-colors:0 ${color},1 ${color}}`}
        </style>
      )}
      <i
        ref={ref}
        className={buildClassName(`${iconPrefix} ${iconPrefix}-${name}`, className)}
        style={{
          ...style,
          ...(color && { color, fontPalette: paletteId } as CSSProperties),
        }}
        aria-hidden={!ariaLabel}
        aria-label={ariaLabel}
        role={role}
        onClick={onClick}
      />
    </>
  );
};

export default Icon;
