import * as d3 from 'd3';
import { aapl } from './LineChart.data';

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

export function LineChart(elem: SVGSVGElement): void {
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
  const x_format = d3.timeFormat('%m-%d');
  const xAxis = d3
    .axisBottom(x_scale)
    .ticks(c.width / 80, x_format)
    .tickSizeOuter(0);
  svg
    .append('g')
    .attr('transform', `translate(0,${c.height - c.marginBottom})`)
    .call(xAxis);

  // 画 Y轴
  // const y_series = d3.map(data, (d) => d.close);
  const y_domain = d3.extent([0, d3.max([d3.max(line1_series), d3.max(line2_series)])]);
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

  /**
   * 画 tooltip
   */
  const focus = svg.append('g');
  const focus_tooltip = focus.append('g').style('pointer-events', 'none');
  const focus_line = focus
    .append('line')
    .attr('stroke', '#B74779')
    .attr('stroke-width', '1px')
    .attr('stroke-dasharray', '3,3')
    .attr('y1', 0)
    .attr('y2', c.height);

  const onPointerMove = (event: PointerEvent) => {
    const pointer = d3.pointer(event);
    const x_index = d3.bisectCenter(x_series, x_scale.invert(pointer[0]));
    focus.attr('transform', `translate(${x_scale(x_series[x_index])},0)`);
    focus.style('display', null);

    const path = focus_tooltip
      .selectAll('path')
      .data([undefined])
      .join('path')
      .attr('fill', 'white')
      .attr('stroke', 'black');

    const text = focus_tooltip
      .selectAll<SVGTextElement, null>('text')
      .data([undefined])
      .join('text')
      .call((text) =>
        text
          .selectAll('tspan')
          .data([x_format(x_series[x_index]), line1_series[x_index], line2_series[x_index]])
          .join('tspan')
          .attr('x', 0)
          .attr('y', (_, i) => `${i * 1.1}em`)
          .attr('font-weight', (_, i) => (i ? null : 'bold'))
          .text((d) => d),
      );

    const { x, y, width: w, height: h } = text.node().getBBox(); // 根据text的实际尺寸来计算外边框的尺寸和位置
    text.attr('transform', `translate(${-w / 2},${15 - y})`);
    path.attr('d', `M${-w / 2 - 10},5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
    focus_tooltip.attr('transform', `translate(${w / 2 + 20},${pointer[1]})`);
    // svg.property('value', line1_series[x_index]).dispatch('input', { bubbles: true });
  };

  const onPointerLeave = () => {
    focus.style('display', 'none');
    // svg.property('value', null).dispatch('input', { bubbles: true });
  };
  onPointerLeave();
  svg
    .on('pointerenter pointermove', onPointerMove)
    .on('pointerleave', onPointerLeave)
    .on('touchstart', (event) => event.preventDefault());
}
