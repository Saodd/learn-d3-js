import * as React from 'react';
import { useEffect, useRef } from 'react';
import styles from './index.scss';
import { LineChart } from './LineChart';

export function App(): JSX.Element {
  const ref = useRef<SVGSVGElement>(null);
  const ref2 = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const chart = new LineChart(ref.current);
    chart.render();
  }, []);

  return (
    <div id={'app'}>
      <div style={{ border: '1px solid black', fontSize: '12px' }}>
        <svg ref={ref} />
      </div>
      <div style={{ border: '1px solid black' }}>
        <svg ref={ref2} />
      </div>
    </div>
  );
}
