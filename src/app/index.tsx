import * as React from 'react';
import { useEffect, useRef } from 'react';
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
const now = new Date('2022-11-23T20:00:00+0800').valueOf();
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
        formatter: (v) => v.toString(),
      },
      {
        title: '销量',
        color: colors[1],
        extractor: (item) => item.count,
        formatter: (v) => v.toString(),
      },
    ],
    part2: [
      {
        title: '改价',
        color: colors[2],
        extractor: (item) => item.setPrice,
        formatter: (v) => v.toString(),
      },
      {
        title: '改库存',
        color: colors[3],
        extractor: (item) => item.setStock,
        formatter: (v) => v.toString(),
      },
    ],
  };
data.items[10].count = 20;
data.items[11].count = 0;
data.items[20].count = undefined;

export function App(): JSX.Element {
  const ref = useRef<SVGSVGElement>(null);
  const ref2 = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const chart = new LineChart(data);
    chart.render(ref.current, {
      width: 800,
      height: 600,
      marginTop: 20, // top margin, in pixels
      marginRight: 30, // right margin, in pixels
      marginBottom: 30, // bottom margin, in pixels
      marginLeft: 40, // left margin, in pixels
    });
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
