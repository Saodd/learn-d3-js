import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.scss';
import { LineChart, LineChartData } from './LineChart';

class Random {
  static seed = 1;
  static random(): number {
    const x = Math.sin(Random.seed++) * 10000;
    return x - Math.floor(x);
  }
}

const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
const now = new Date('2022-11-23T09:00:00+0800').valueOf();
const data: LineChartData<{ timestamp: number; people: number; count: number; setPrice?: number; setStock?: number }> =
  {
    items: new Array(100).fill(null).map((v, i) => ({
      timestamp: now + 60000 * i,
      people: ~~(Random.random() * 100),
      count: 10,
      setPrice: Random.random() > 0.7 ? 1 : undefined,
      setStock: Random.random() > 0.8 ? 2 : undefined,
    })),
    part1: [
      {
        title: '在线人数',
        color: colors[0],
        extractor: (item) => item.people,
        formatter: (v) => v + ' 人',
      },
      {
        title: '销量',
        color: colors[1],
        extractor: (item) => item.count,
        formatter: (v) => v + ' 件',
      },
    ],
    part2: [
      {
        title: '改价',
        color: colors[2],
        extractor: (item) => item.setPrice,
        formatter: (v) => v + ' 次',
      },
      {
        title: '改库存',
        color: colors[3],
        extractor: (item) => item.setStock,
        formatter: (v) => v + ' 次',
      },
    ],
  };
data.items[10].count = 20;
data.items[11].count = 0;
data.items[20].count = undefined;

export function App(): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState('translate(0,0)');
  const [xIndex, setXIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const height = 600;
    const width = 800;

    const chart = new LineChart(data);
    chart.render(svgRef.current, {
      width,
      height,
      marginTop: 20, // top margin, in pixels
      marginRight: 30, // right margin, in pixels
      marginBottom: 30, // bottom margin, in pixels
      marginLeft: 40, // left margin, in pixels
      onPointerMove: (pointer, xIndex) => {
        setVisible(true);
        setXIndex(xIndex);
        const { clientWidth, clientHeight } = tooltipRef.current;
        const xOffset = 20 + clientWidth;
        const yOffset = 20 + clientHeight;
        const x = pointer[0] + xOffset > width ? pointer[0] - xOffset : pointer[0] + 20;
        const y = pointer[1] + yOffset > height ? pointer[1] - yOffset : pointer[1] + 20;
        setTransform(`translate(${x}px,${y}px)`);
      },
      onPointerLeave: () => {
        setVisible(false);
      },
    });
  }, []);

  const title = useMemo(() => {
    const timestamp = data.items[xIndex].timestamp;
    const dt = new Date(timestamp);
    return <b>{`${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`}</b>;
  }, [xIndex]);
  const body = useMemo(() => {
    const item = data.items[xIndex];
    return (
      <table>
        <tbody className={styles.tooltipBodyTable}>
          {[...data.part1.filter((s) => !isNaN(s.extractor(item))), ...data.part2].map((s) => {
            return (
              <tr style={{ color: s.color }} key={s.title}>
                <td>
                  <div className={styles.circle} style={{ backgroundColor: s.color }}></div>
                  <span>{s.title}</span>
                </td>
                <td>{s.formatter(s.extractor(item) || 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }, [xIndex]);

  return (
    <div id={'app'}>
      <div className={styles.chart}>
        <svg ref={svgRef} />
        {visible && (
          <div ref={tooltipRef} className={styles.tooltip} style={{ transform }}>
            {title}
            {body}
          </div>
        )}
      </div>
    </div>
  );
}
