import * as d3 from 'd3';
import { aapl } from './LineChart.data';

const config = {
  width: 500,
  height: 300,
  heightPart2: 80,
  marginTop: 20, // top margin, in pixels
  marginRight: 30, // right margin, in pixels
  marginBottom: 30, // bottom margin, in pixels
  marginLeft: 40, // left margin, in pixels
  color: 'currentColor', // stroke color of line
  strokeWidth: 1.5, // stroke width of line, in pixels
  strokeLinejoin: 'round', // stroke line join of line
  strokeLinecap: 'round', // stroke line cap of line
};

export class LineChart {
  config = config;
  data = aapl;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

  constructor(elem: SVGSVGElement) {
    const { width, height } = this.config;
    this.svg = d3.select(elem).attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]);
  }

  render(): void {
    this.render_xAxis();
    this.render_Part1();
    this.render_Part2();
    this.render_tooltip();
  }

  private x_series: Date[];
  private x_scale: d3.ScaleTime<number, number, never>;
  private x_format: (date: Date) => string;
  private render_xAxis(): void {
    const { svg, data, config } = this;
    const { marginLeft, marginRight, marginBottom, width, height } = config;

    const x_series = (this.x_series = d3.map(data, (d) => d.date));
    const x_domain = d3.extent(x_series);
    const x_scale = (this.x_scale = d3.scaleUtc(x_domain, [marginLeft, width - marginRight]));
    const x_format = (this.x_format = d3.timeFormat('%m-%d'));
    const xAxis = d3.axisBottom(x_scale).ticks(width / 50, x_format);
    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .style('font-size', 10)
      .call(xAxis);
  }

  private line1_series: number[];
  private line2_series: number[];
  private part1_y_scale: d3.ScaleLinear<number, number, never>;
  private render_Part1(): void {
    const { svg, data, config, x_series, x_scale } = this;
    const { marginLeft, marginRight, marginTop, marginBottom, width, height, heightPart2 } = config;
    const c = config;

    /**
     * 裁剪区域
     */
    const lines_clip = svg
      .append('defs')
      .append('svg:clipPath')
      .attr('id', 'lines_clip')
      .append('svg:rect')
      .attr('x', marginLeft)
      .attr('y', marginTop)
      .attr('width', width - marginLeft - marginRight)
      .attr('height', height - marginTop - marginBottom - heightPart2);
    const lines_group = svg.append('g').attr('clip-path', 'url(#lines_clip)');

    /**
     * 线条数据
     */
    const line1_series = (this.line1_series = d3.map(data, (d) => d.close));
    const line2_series = (this.line2_series = d3.map(data, (d) => d.open));

    /**
     * 画 Y轴
     */
    const y_domain = d3.extent([0, d3.max([d3.max(line1_series), d3.max(line2_series)])]);
    const y_scale = (this.part1_y_scale = d3.scaleLinear(y_domain, [height - marginBottom - heightPart2, marginTop]));
    const y_axis = d3.axisLeft(y_scale).ticks(height / 50, null);
    svg
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(y_axis)
      // .call((g) => g.select('.domain').remove())
      .call((g) => {
        g.selectAll('.tick line')
          .clone()
          .attr('x2', width - marginLeft - marginRight)
          .attr('stroke-opacity', 0.1);
      });

    /**
     * 画 第一条线
     */
    const line1_defined = d3.map(data, (d) => d.date && !isNaN(d.close));
    const line = d3
      .line<number>()
      .defined((i) => line1_defined[i])
      .curve(d3.curveLinear) // https://github.com/d3/d3/blob/main/API.md#curves
      .x((i) => x_scale(x_series[i]))
      .y((i) => y_scale(line1_series[i]));
    const line1_path = lines_group
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', c.color)
      .attr('stroke-width', c.strokeWidth)
      .attr('stroke-linejoin', c.strokeLinejoin)
      .attr('stroke-linecap', c.strokeLinecap)
      .attr('d', line(d3.map(data, (_, i) => i)));
    line1_path
      .on('pointerenter pointermove', () => {
        line1_path.attr('stroke-width', c.strokeWidth * 2);
      })
      .on('pointerleave', () => {
        line1_path.attr('stroke-width', c.strokeWidth);
      });

    /**
     * 画 第二条线
     */
    const line2_defined = d3.map(data, (d) => d.date && !isNaN(d.open));
    const line2 = d3
      .line<number>()
      .defined((i) => line2_defined[i])
      .curve(d3.curveLinear)
      .x((i) => x_scale(x_series[i]))
      .y((i) => y_scale(line2_series[i]));
    const line2_path = lines_group
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'red')
      .attr('stroke-width', c.strokeWidth)
      .attr('stroke-linejoin', c.strokeLinejoin)
      .attr('stroke-linecap', c.strokeLinecap)
      .attr('d', line2(d3.map(data, (_, i) => i)));
    line2_path
      .on('pointerenter pointermove', () => {
        line2_path.attr('stroke-width', c.strokeWidth * 2);
      })
      .on('pointerleave', () => {
        line2_path.attr('stroke-width', c.strokeWidth);
      });
  }

  private scatter1_series: number[];
  private scatter2_series: number[];
  private render_Part2(): void {
    const { data, config: c, x_series, x_scale } = this;
    const { marginLeft, marginRight, marginTop, marginBottom, width, height, heightPart2 } = c;
    const part2 = this.svg.append('g');

    /**
     * 散点数据
     */
    const series1: { v: number; i: number }[] = (this.scatter1_series = data.map((d) => d.action1)).reduce(
      (prev, v, i) => {
        if (v) prev.push({ v, i });
        return prev;
      },
      [],
    );
    const series2: { v: number; i: number }[] = (this.scatter2_series = data.map((d) => d.action2)).reduce(
      (prev, v, i) => {
        if (v) prev.push({ v, i });
        return prev;
      },
      [],
    );

    /**
     * 画 Y轴
     */
    const y_specifier = ['改价格', '改库存'];
    const y_top = height - marginBottom - heightPart2;
    const y_tick_height = heightPart2 / y_specifier.length;
    const y_scale = d3.scaleLinear([0, 2], [height - marginBottom, y_top]);
    const y_axis = d3
      .axisLeft(y_scale)
      .tickValues([0, 1]) // https://stackoverflow.com/questions/44872048/d3-js-how-can-i-create-an-axis-with-custom-labels-and-customs-ticks
      .tickFormat((v) => y_specifier[v.valueOf()]);
    part2
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(y_axis)
      .call((g) => g.selectAll('.tick text').attr('transform', `translate(0,-${y_tick_height / 2})`));

    /**
     * 画 散点
     * https://d3-graph-gallery.com/graph/scatter_basic.html
     */
    part2
      .append('g')
      .attr('transform', `translate(0,-${y_tick_height / 2})`)
      .selectAll('circle')
      .data(series1)
      .join('circle')
      .attr('cx', (item) => x_scale(x_series[item.i]))
      .attr('cy', y_scale(0))
      .attr('r', 3)
      .style('fill', '#69b3a2');
    part2
      .append('g')
      .attr('transform', `translate(0,-${y_tick_height / 2})`)
      .selectAll('circle')
      .data(series2)
      .join('circle')
      .attr('cx', (item) => x_scale(x_series[item.i]))
      .attr('cy', y_scale(1))
      .attr('r', 3)
      .style('fill', '#69b3a2');
  }

  private render_tooltip(): void {
    const { svg, config: c, x_series, x_scale, x_format, line1_series, line2_series, part1_y_scale } = this;

    const focus = svg.append('g');
    const focus_line = focus
      .append('line')
      .attr('stroke', '#B74779')
      .attr('stroke-width', '1px')
      .attr('y1', 0)
      .attr('y2', c.height);
    const focus_points = focus.append('g');
    const focus_tooltip = focus.append('g').style('pointer-events', 'none');

    const onPointerMove = (event: PointerEvent) => {
      focus.style('display', null);
      const pointer = d3.pointer(event);
      const x_index = d3.bisectCenter(x_series, x_scale.invert(pointer[0]));
      const x_line_position = x_scale(x_series[x_index]);
      focus_line.attr('transform', `translate(${x_line_position},0)`);
      focus_points
        .selectAll('.focus-pointer')
        .data<{ y: number }>(
          [line1_series[x_index], line2_series[x_index]].filter((y) => !!y).map((y) => ({ y: part1_y_scale(y) })),
        )
        .join('circle') // enter append
        .attr('class', 'focus-pointer')
        .attr('fill', 'white')
        .attr('stroke-width', '1')
        .attr('stroke', 'blue')
        .attr('r', '2') // radius
        .attr('cx', x_line_position) // center x passing through your xScale
        .attr('cy', (d) => d.y); // center y through your yScale;

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
      focus_tooltip.attr('transform', `translate(${pointer[0] + w / 2 + 20},${pointer[1] + 10})`);
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
}
