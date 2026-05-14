/**
 * ChartShell – wraps any Recharts chart and defers rendering until the
 * container has a measurable positive width.  This eliminates the recurring
 * "width(-1) and height(-1) of chart should be greater than 0" warning that
 * fires when a chart mounts before its parent has been laid out.
 *
 * Usage (height is required, width is injected automatically):
 *
 *   <ChartShell height={280}>
 *     <BarChart data={...} margin={...}>
 *       ...
 *     </BarChart>
 *   </ChartShell>
 *
 * The child must be a single Recharts chart element.  ChartShell clones it
 * and passes the measured `width` and the provided `height` as props.
 */
import { cloneElement, useEffect, useRef, useState, type ReactElement } from 'react';

interface ChartShellProps {
  /** Pixel height for the chart */
  height: number;
  /** Single Recharts chart element (BarChart, LineChart, etc.) */
  children: ReactElement;
  /** Extra class names for the wrapper div */
  className?: string;
}

export default function ChartShell({ height, children, className = '' }: ChartShellProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const update = () =>
      setWidth(Math.max(1, Math.floor(ref.current?.getBoundingClientRect().width ?? 0)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`min-w-0 ${className}`} style={{ height }}>
      {width > 1 ? (
        cloneElement(children, { width, height })
      ) : (
        <div className="h-full w-full animate-pulse rounded-xl bg-slate-800/30" />
      )}
    </div>
  );
}
