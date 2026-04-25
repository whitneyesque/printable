const UNITS_PER_INCH = 100;

function toSVGPoint(svg: SVGSVGElement, e: PointerEvent): DOMPoint {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return pt;
  return pt.matrixTransform(ctm.inverse());
}

export function setupDrag(
  svg: SVGSVGElement,
  target: SVGElement,
  getPos: () => { x: number; y: number },
  onMove: (x: number, y: number) => void,
): void {
  let dragging = false;
  let startSVG = { x: 0, y: 0 };
  let startPos = { x: 0, y: 0 };

  target.style.cursor = 'move';

  target.addEventListener('pointerdown', (e: Event) => {
    const pe = e as PointerEvent;
    pe.stopPropagation();
    dragging = true;
    target.setPointerCapture(pe.pointerId);
    const pt = toSVGPoint(svg, pe);
    startSVG = { x: pt.x, y: pt.y };
    startPos = getPos();
  });

  target.addEventListener('pointermove', (e: Event) => {
    if (!dragging) return;
    const pe = e as PointerEvent;
    const pt = toSVGPoint(svg, pe);
    onMove(startPos.x + (pt.x - startSVG.x), startPos.y + (pt.y - startSVG.y));
  });

  target.addEventListener('pointerup', () => {
    dragging = false;
  });
  target.addEventListener('pointercancel', () => {
    dragging = false;
  });
}

export function setupRotationHandle(
  svg: SVGSVGElement,
  handle: SVGCircleElement,
  getCenter: () => { x: number; y: number },
  getRotation: () => number,
  setRotation: (deg: number) => void,
): void {
  handle.style.cursor = 'grab';

  handle.addEventListener('pointerdown', (e: Event) => {
    const pe = e as PointerEvent;
    pe.stopPropagation();
    handle.setPointerCapture(pe.pointerId);

    const center = getCenter();
    const startPt = toSVGPoint(svg, pe);
    // angle measured clockwise from "up" — matches CSS/SVG rotate convention
    const startAngle = (Math.atan2(startPt.x - center.x, -(startPt.y - center.y)) * 180) / Math.PI;
    const startRotation = getRotation();
    let active = true;

    const onMove = (me: Event) => {
      if (!active) return;
      const mpe = me as PointerEvent;
      const pt = toSVGPoint(svg, mpe);
      const angle = (Math.atan2(pt.x - center.x, -(pt.y - center.y)) * 180) / Math.PI;
      setRotation(startRotation + angle - startAngle);
    };

    const onUp = () => {
      active = false;
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
    };

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  });
}

export function setupResizeHandle(
  svg: SVGSVGElement,
  handle: SVGElement,
  getSizeIn: () => number,
  onResize: (sizeIn: number) => void,
): void {
  let dragging = false;
  let startX = 0;
  let startSizeIn = 0;

  handle.style.cursor = 'ew-resize';

  handle.addEventListener('pointerdown', (e: Event) => {
    const pe = e as PointerEvent;
    pe.stopPropagation();
    dragging = true;
    handle.setPointerCapture(pe.pointerId);
    startX = toSVGPoint(svg, pe).x;
    startSizeIn = getSizeIn();
  });

  handle.addEventListener('pointermove', (e: Event) => {
    if (!dragging) return;
    const pe = e as PointerEvent;
    const delta = (toSVGPoint(svg, pe).x - startX) / UNITS_PER_INCH;
    onResize(Math.max(0.25, startSizeIn + delta));
  });

  handle.addEventListener('pointerup', () => {
    dragging = false;
  });
  handle.addEventListener('pointercancel', () => {
    dragging = false;
  });
}
