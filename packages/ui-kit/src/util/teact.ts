//@ts-nocheck
const extraStyles = new WeakMap<Element, Record<string, string>>();
type DOMElement = HTMLElement | SVGElement;


const extraClasses = new WeakMap<Element, Set<string>>();

export function setExtraStyles(element: DOMElement, styles: Partial<CSSStyleDeclaration> & AnyLiteral) {
    extraStyles.set(element, styles);
    applyExtraStyles(element);
  }
  
  function applyExtraStyles(element: DOMElement) {
    const standardStyles = Object.entries(extraStyles.get(element)!).reduce<Record<string, string>>(
      (acc, [prop, value]) => {
        if (prop.startsWith('--')) {
          element.style.setProperty(prop, value);
        } else {
          acc[prop] = value;
        }
  
        return acc;
      },
      {},
    );
  
    Object.assign(element.style, standardStyles);
  }


  export function addExtraClass(element: DOMElement, className: string) {
    element.classList.add(className);
  
    const classList = extraClasses.get(element);
    if (classList) {
      classList.add(className);
    } else {
      extraClasses.set(element, new Set([className]));
    }
  }
  export function removeExtraClass(element: DOMElement, className: string) {
    element.classList.remove(className);
  
    const classList = extraClasses.get(element);
    if (classList) {
      classList.delete(className);
  
      if (!classList.size) {
        extraClasses.delete(element);
      }
    }
  }
  export function toggleExtraClass(element: DOMElement, className: string, force?: boolean) {
    if (force === true) {
      addExtraClass(element, className);
    } else if (force === false) {
      removeExtraClass(element, className);
    } else if (extraClasses.get(element)?.has(className)) {
      removeExtraClass(element, className);
    } else {
      addExtraClass(element, className);
    }
  }
 