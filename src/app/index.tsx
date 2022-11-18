import * as React from 'react';
import { useEffect, useRef } from 'react';
import styles from './index.scss';
import { LineChart } from './LineChart';

export function App(): JSX.Element {
  const ref = useRef<SVGSVGElement>(null);
  const ref2 = useRef<SVGSVGElement>(null);
  useEffect(() => {
    LineChart(ref.current);
  }, []);

  return (
    <div id={'app'}>
      <p className={styles.myClass}>Hello, Lewin!</p>
      <p>当前版本为{__NPM_VERSION__}</p>
      <div style={{ border: '1px solid black', fontSize: '12px' }}>
        <svg ref={ref} />
      </div>
      <div style={{ border: '1px solid black' }}>
        <svg ref={ref2} />
      </div>
    </div>
  );
}
