import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';
import { useState } from 'react';

import './Sidebar.scss';
import { buildClassName } from '../../util/buildClassName.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SidebarItem = {
  id: string;
  label: ReactNode;
  /** Leading icon (or any element). */
  icon?: ReactNode;
  /** Render as `<a href>` instead of `<button>`. */
  href?: string;
  /** Click handler. Called even for items that have nested `items`. */
  onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
  /** Marks the item visually active. Auto-derived from `activeId` if omitted. */
  active?: boolean;
  disabled?: boolean;
  /** Right-aligned slot — pass a `<Badge>` or any node. */
  badge?: ReactNode;
  /** Sub-items render under a collapsible chevron. */
  items?: SidebarItem[];
  /** Initial open state for the group (uncontrolled). */
  defaultOpen?: boolean;
};

export type SidebarProps = {
  items: SidebarItem[];
  /** Secondary item list rendered below a horizontal divider. */
  footerItems?: SidebarItem[];

  /** Top slot — typically the brand logo or a user profile. */
  header?: ReactNode;
  /** Bottom slot — info card, settings row, etc. */
  footer?: ReactNode;

  /** Controlled active item id. */
  activeId?: string;
  /** Initial active item id (uncontrolled). */
  defaultActiveId?: string;
  /** Fires when a leaf item is clicked. Group toggles do not fire this. */
  onItemClick?: (id: string, item: SidebarItem) => void;

  /** Icon-only mode. Default width drops to `collapsedWidth`. */
  collapsed?: boolean;
  width?: number | string;
  collapsedWidth?: number | string;

  ariaLabel?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
};

// ─── Inline icon ─────────────────────────────────────────────────────────────

const ChevronIcon = () => (
  <svg
    className="Sidebar__chevron-svg"
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function containsActive(item: SidebarItem, activeId?: string): boolean {
  if (!activeId) return false;
  if (!item.items?.length) return false;
  return item.items.some(
    (c) => c.id === activeId || containsActive(c, activeId),
  );
}

function toCss(v: number | string | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

// ─── Sidebar item view (recursive) ───────────────────────────────────────────

type ItemViewProps = {
  item: SidebarItem;
  activeId?: string;
  onLeafClick: (item: SidebarItem, e: ReactMouseEvent<HTMLElement>) => void;
  collapsed?: boolean;
  level?: number;
};

const ItemView: React.FC<ItemViewProps> = ({
  item,
  activeId,
  onLeafClick,
  collapsed,
  level = 0,
}) => {
  const hasChildren = !!item.items?.length;
  const childActive = containsActive(item, activeId);

  const [isOpen, setIsOpen] = useState<boolean>(
    item.defaultOpen ?? childActive,
  );

  const isActive = item.active ?? activeId === item.id;

  const itemClassName = buildClassName(
    'Sidebar__item',
    isActive && 'Sidebar__item--active',
    item.disabled && 'Sidebar__item--disabled',
    hasChildren && 'Sidebar__item--has-children',
    isOpen && hasChildren && 'Sidebar__item--open',
    level > 0 && 'Sidebar__item--sub',
  );

  const handleClick = (e: ReactMouseEvent<HTMLElement>) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    if (hasChildren) {
      e.preventDefault();
      setIsOpen((v) => !v);
    } else {
      onLeafClick(item, e);
    }
    item.onClick?.(e);
  };

  const inner = (
    <>
      {item.icon && (
        <span className="Sidebar__item-icon" aria-hidden="true">
          {item.icon}
        </span>
      )}
      <span className="Sidebar__item-label">{item.label}</span>
      {item.badge !== undefined && !collapsed && (
        <span className="Sidebar__item-badge">{item.badge}</span>
      )}
      {hasChildren && !collapsed && (
        <span className="Sidebar__item-chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      )}
    </>
  );

  const interactive =
    item.href && !hasChildren ? (
      <a
        href={item.href}
        className={itemClassName}
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={item.disabled || undefined}
        onClick={handleClick}
        title={collapsed && typeof item.label === 'string' ? item.label : undefined}
      >
        {inner}
      </a>
    ) : (
      <button
        type="button"
        className={itemClassName}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-disabled={item.disabled || undefined}
        disabled={item.disabled}
        onClick={handleClick}
        title={collapsed && typeof item.label === 'string' ? item.label : undefined}
      >
        {inner}
      </button>
    );

  return (
    <li className="Sidebar__list-item">
      {interactive}
      {hasChildren && isOpen && !collapsed && (
        <ul className="Sidebar__sublist">
          {item.items!.map((child) => (
            <ItemView
              key={child.id}
              item={child}
              activeId={activeId}
              onLeafClick={onLeafClick}
              level={level + 1}
              collapsed={collapsed}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({
  items,
  footerItems,
  header,
  footer,
  activeId: controlledActive,
  defaultActiveId,
  onItemClick,
  collapsed,
  width = 288,
  collapsedWidth = 64,
  ariaLabel = 'Sidebar',
  id,
  className,
  style,
}) => {
  const [internalActive, setInternalActive] = useState<string | undefined>(
    defaultActiveId,
  );
  const isActiveControlled = controlledActive !== undefined;
  const activeId = isActiveControlled ? controlledActive : internalActive;

  const handleLeafClick = (
    item: SidebarItem,
    _e: ReactMouseEvent<HTMLElement>,
  ) => {
    if (!isActiveControlled) setInternalActive(item.id);
    onItemClick?.(item.id, item);
  };

  const cssWidth = collapsed ? toCss(collapsedWidth) : toCss(width);

  return (
    <nav
      id={id}
      aria-label={ariaLabel}
      className={buildClassName(
        'Sidebar',
        collapsed && 'Sidebar--collapsed',
        className,
      )}
      style={{ width: cssWidth, ...style }}
    >
      {header && <div className="Sidebar__header">{header}</div>}

      <div className="Sidebar__main">
        <ul className="Sidebar__list">
          {items.map((item) => (
            <ItemView
              key={item.id}
              item={item}
              activeId={activeId}
              onLeafClick={handleLeafClick}
              collapsed={collapsed}
            />
          ))}
        </ul>

        {footerItems && footerItems.length > 0 && (
          <>
            <div className="Sidebar__divider" aria-hidden="true" />
            <ul className="Sidebar__list">
              {footerItems.map((item) => (
                <ItemView
                  key={item.id}
                  item={item}
                  activeId={activeId}
                  onLeafClick={handleLeafClick}
                  collapsed={collapsed}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {footer && <div className="Sidebar__footer">{footer}</div>}
    </nav>
  );
};

export default Sidebar;
