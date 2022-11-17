import * as React from 'react';
import styles from './index.scss';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export function App(): JSX.Element {
  const ref = useRef<SVGSVGElement>(null);
  const ref2 = useRef<SVGSVGElement>(null);
  useEffect(() => {
    LineChart(ref.current);
    LineChart0(
      aapl,
      {
        x: (d) => d.date,
        y: (d) => d.close,
        yLabel: '↑ Daily close ($)',
        width: 500,
        height: 500,
        color: 'steelblue',
      },
      ref2.current,
    );
  }, []);

  return (
    <div id={'app'}>
      <p className={styles.myClass}>Hello, Lewin!</p>
      <p>当前版本为{__NPM_VERSION__}</p>
      <div style={{ border: '1px solid black' }}>
        <svg ref={ref} />
      </div>
      <div style={{ border: '1px solid black' }}>
        <svg ref={ref2} />
      </div>
    </div>
  );
}

const aapl: { date: Date; close: number; open?: number }[] = [
  {
    date: new Date('2007-04-16'),
    close: 10,
  },
  {
    date: new Date('2007-04-17'),
    close: 10,
    open: -10,
  },
  {
    date: new Date('2007-04-18'),
    close: 10,
    open: 8,
  },
  {
    date: new Date('2007-04-19'),
    close: 10,
    open: 12,
  },
  {
    date: new Date('2007-04-20'),
    close: 10,
    open: 10,
  },
  {
    date: new Date('2007-04-21'),
    close: 10,
  },
  {
    date: new Date('2007-04-22'),
    close: 10,
  },
  {
    date: new Date('2007-04-23'),
    close: 93.24,
  },
  {
    date: new Date('2007-04-24'),
    close: 1,
  },
  {
    date: new Date('2007-04-25'),
    close: 95,
  },
  {
    date: new Date('2007-04-26'),
    close: 200,
  },
  {
    date: new Date('2007-04-27'),
    close: 96,
  },
  {
    date: new Date('2007-04-28'),
    close: 97,
  },
];
const config = {
  width: 500,
  height: 500,
  marginTop: 20, // top margin, in pixels
  marginRight: 30, // right margin, in pixels
  marginBottom: 30, // bottom margin, in pixels
  marginLeft: 40, // left margin, in pixels
  color: 'currentColor', // stroke color of line
  strokeWidth: 1.5, // stroke width of line, in pixels
  strokeLinejoin: 'round', // stroke line join of line
  strokeLinecap: 'round', // stroke line cap of line
};

function LineChart(elem: SVGSVGElement): void {
  const data = aapl;
  const c = config;
  const svg = d3
    .select(elem)
    .attr('width', c.width)
    .attr('height', c.height)
    .attr('viewBox', [0, 0, c.width, c.height]);

  // 线条数据
  const line1_series = d3.map(data, (d) => d.close);
  const line2_series = d3.map(data, (d) => d.open);

  // 画 X轴
  const x_series = d3.map(data, (d) => d.date);
  const x_domain = d3.extent(x_series);
  const x_scale = d3.scaleUtc(x_domain, [c.marginLeft, c.width - c.marginRight]);
  const xAxis = d3
    .axisBottom(x_scale)
    .ticks(c.width / 80, d3.timeFormat('%m-%d'))
    .tickSizeOuter(0);
  svg
    .append('g')
    .attr('transform', `translate(0,${c.height - c.marginBottom})`)
    .call(xAxis);

  // 画 Y轴
  const y_series = d3.map(data, (d) => d.close);
  const y_domain = d3.extent([...d3.extent(line1_series), ...d3.extent(line2_series)]);
  const y_scale = d3.scaleLinear(y_domain, [c.height - c.marginBottom, c.marginTop]);
  const y_axis = d3.axisLeft(y_scale).ticks(c.height / 40, null);
  svg
    .append('g')
    .attr('transform', `translate(${c.marginLeft},0)`)
    .call(y_axis)
    .call((g) => g.select('.domain').remove())
    .call((g) => {
      g.selectAll('.tick line')
        .clone()
        .attr('x2', c.width - c.marginLeft - c.marginRight)
        .attr('stroke-opacity', 0.1);
    });

  // 画 第一条线
  const line1_defined = d3.map(data, (d) => d.date && !isNaN(d.close));
  const line = d3
    .line<number>()
    .defined((i) => line1_defined[i])
    .curve(d3.curveLinear)
    .x((i) => x_scale(x_series[i]))
    .y((i) => y_scale(line1_series[i]));
  svg
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', c.color)
    .attr('stroke-width', c.strokeWidth)
    .attr('stroke-linejoin', c.strokeLinejoin)
    .attr('stroke-linecap', c.strokeLinecap)
    .attr('d', line(d3.map(data, (_, i) => i)));

  // 画 第二条线
  const line2_defined = d3.map(data, (d) => d.date && !isNaN(d.open));
  const line2 = d3
    .line<number>()
    .defined((i) => line2_defined[i])
    .curve(d3.curveLinear)
    .x((i) => x_scale(x_series[i]))
    .y((i) => y_scale(line2_series[i]));
  svg
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('stroke-width', c.strokeWidth)
    .attr('stroke-linejoin', c.strokeLinejoin)
    .attr('stroke-linecap', c.strokeLinecap)
    .attr('d', line2(d3.map(data, (_, i) => i)));
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/line-with-tooltip
function LineChart0(
  data: { date: Date; close: number }[],
  {
    x = ([x]) => x, // given d in data, returns the (temporal) x-value
    y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
    title, // given d in data, returns the title text
    defined, // for gaps in data
    curve = d3.curveLinear, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xType = d3.scaleUtc, // type of x-scale
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    color = 'currentColor', // stroke color of line
    strokeWidth = 1.5, // stroke width of line, in pixels
    strokeLinejoin = 'round', // stroke line join of line
    strokeLinecap = 'round', // stroke line cap of line
    yFormat, // a format specifier string for the y-axis
    yLabel, // a label for the y-axis
  }: {
    x: (elem) => Date;
    y: (elem) => number;
    defined?: (e, i: number) => boolean;
    [other: string]: any;
  },
  elem: SVGSVGElement,
) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const O = d3.map(data, (d) => d);
  const I = d3.map(data, (_, i) => i);

  // Compute which data points are considered defined.
  if (defined === undefined) defined = (d, i: number) => !!X[i] && !!Y[i]; // !isNaN(X[i]) && !isNaN(Y[i]);
  const D = d3.map(data, defined);

  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = [0, d3.max(Y)];

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(width / 80)
    .tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

  // Compute titles.
  if (title === undefined) {
    const formatDate = xScale.tickFormat(null, '%b %-d, %Y');
    const formatValue = yScale.tickFormat(100, yFormat);
    title = (i) => `${formatDate(X[i])}\n${formatValue(Y[i])}`;
  } else {
    const O = d3.map(data, (d) => d);
    const T = title;
    title = (i) => T(O[i], i, data);
  }

  // Construct a line generator.
  const line = d3
    .line<number>()
    .defined((i) => D[i])
    .curve(curve)
    .x((i) => xScale(X[i]))
    .y((i) => yScale(Y[i]));

  const svg = d3
    .select(elem)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .style('-webkit-tap-highlight-color', 'transparent')
    .style('overflow', 'visible')
    .on('pointerenter pointermove', pointermoved)
    .on('pointerleave', pointerleft)
    .on('touchstart', (event) => event.preventDefault());

  svg
    .append('g')
    .attr('transform', `translate(0,${height - marginBottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${marginLeft},0)`)
    .call(yAxis)
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('.tick line')
        .clone()
        .attr('x2', width - marginLeft - marginRight)
        .attr('stroke-opacity', 0.1),
    )
    .call((g) =>
      g
        .append('text')
        .attr('x', -marginLeft)
        .attr('y', 10)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text(yLabel),
    );

  svg
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-linejoin', strokeLinejoin)
    .attr('stroke-linecap', strokeLinecap)
    .attr('d', line(I));

  const tooltip = svg.append('g').style('pointer-events', 'none');

  function pointermoved(event) {
    const i = d3.bisectCenter(X, xScale.invert(d3.pointer(event)[0]));
    tooltip.style('display', null);
    tooltip.attr('transform', `translate(${xScale(X[i])},${yScale(Y[i])})`);

    const path = tooltip.selectAll('path').data([,]).join('path').attr('fill', 'white').attr('stroke', 'black');

    const text = tooltip
      .selectAll<SVGTextElement, null>('text')
      .data([,])
      .join('text')
      .call((text) =>
        text
          .selectAll('tspan')
          .data(`${title(i)}`.split(/\n/))
          .join('tspan')
          .attr('x', 0)
          .attr('y', (_, i) => `${i * 1.1}em`)
          .attr('font-weight', (_, i) => (i ? null : 'bold'))
          .text((d) => d),
      );

    const { x, y, width: w, height: h } = text.node().getBBox();
    text.attr('transform', `translate(${-w / 2},${15 - y})`);
    path.attr('d', `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
    svg.property('value', O[i]).dispatch('input', { bubbles: true });
  }

  function pointerleft() {
    tooltip.style('display', 'none');
    svg.node().value = null;
    svg.dispatch('input', { bubbles: true });
  }

  return Object.assign(svg.node(), { value: null });
}
