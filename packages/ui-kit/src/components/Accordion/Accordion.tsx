import { type CSSProperties, type ReactNode, useState } from 'react';
import './Accordion.scss';
import { buildClassName } from '../../util/buildClassName.js';

export type AccordionVariant = 'default' | 'flush' | 'separate-cards';
export type AccordionChevronPosition = 'left' | 'right';

export type AccordionItemDef = {
  id: string;
  title: ReactNode;
  subTitle?: ReactNode;
  icon?: ReactNode;
  content: ReactNode;
};

export type AccordionProps = {
  items: AccordionItemDef[];
  variant?: AccordionVariant;
  chevronPosition?: AccordionChevronPosition;
  multiple?: boolean;
  defaultOpen?: string[];
  className?: string;
  style?: CSSProperties;
};

const ChevronIcon = () => (
  <svg
    className="Accordion__chevron-svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M5 7.5l5 5 5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Accordion = ({
  items,
  variant = 'default',
  chevronPosition = 'right',
  multiple = false,
  defaultOpen = [],
  className,
  style,
}: AccordionProps) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpen));

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div
      className={buildClassName(
        'Accordion',
        `Accordion--${variant}`,
        `Accordion--chevron-${chevronPosition}`,
        className,
      )}
      style={style}
    >
      {items.map((item, index) => {
        const isOpen = openIds.has(item.id);
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <div
            key={item.id}
            className={buildClassName(
              'Accordion__item',
              isOpen && 'Accordion__item--open',
              isFirst && 'Accordion__item--first',
              isLast && 'Accordion__item--last',
            )}
          >
            <button
              type="button"
              className="Accordion__trigger"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              id={`accordion-trigger-${item.id}`}
              onClick={() => toggle(item.id)}
            >
              {chevronPosition === 'left' && (
                <span className="Accordion__chevron" aria-hidden="true">
                  <ChevronIcon />
                </span>
              )}
              {item.icon && (
                <span className="Accordion__icon-wrap" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="Accordion__title-wrap">
                <span className="Accordion__title">{item.title}</span>
                {item.subTitle && (
                  <span className="Accordion__sub-title">{item.subTitle}</span>
                )}
              </span>
              {chevronPosition === 'right' && (
                <span className="Accordion__chevron" aria-hidden="true">
                  <ChevronIcon />
                </span>
              )}
            </button>

            <div
              id={`accordion-panel-${item.id}`}
              className="Accordion__panel"
              role="region"
              aria-labelledby={`accordion-trigger-${item.id}`}
            >
              <div className="Accordion__body">
                <div className="Accordion__inner">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
