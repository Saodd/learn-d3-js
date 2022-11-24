import * as d3 from 'd3';

type LineChartConfig = {
  width: number;
  height: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  onPointerMove: (pointer: [number, number], xIndex: number) => void;
  onPointerLeave: () => void;
};
type LineChartDataItem = {
  timestamp: number; // 毫秒
};
export type LineChartData<ItemType extends LineChartDataItem = LineChartDataItem> = {
  items: ItemType[];
  part1: {
    title: string;
    color: string;
    extractor: (item: ItemType) => number;
    formatter: (value: number) => string;
  }[];
  part2: {
    title: string;
    color: string;
    extractor: (item: ItemType) => number;
    formatter: (value: number) => string;
  }[];
};

const Part1_StrokeWidth = 1.5;
const Part2_LineHeight = 50;
const Part2_MarginTop = 50;

export class LineChart<DataType extends LineChartData> {
  config: LineChartConfig;
  data: DataType;

  constructor(data: DataType) {
    this.data = data;
  }

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  render(elem: SVGSVGElement, config: LineChartConfig): void {
    const { width, height } = (this.config = config);
    this.svg = d3.select(elem).attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]);

    this.render_xAxis();
    this.render_Part1();
    this.render_Part2();
    this.render_focus();
    this.render_brush();
  }

  private render_brush(): void {
    const { config: c, data } = this;
    const { marginLeft, marginRight, marginTop, marginBottom, width, height } = c;

    const part1_bottom = height - marginBottom - Part2_LineHeight * data.part2.length - Part2_MarginTop;
    const brush = d3.brushX().extent([
      // [marginLeft, part1_bottom],
      // [width - marginRight, height - marginBottom],
      [0, 0],
      [width, height],
    ]);

    const brush_element = this.svg.append('g').attr('class', 'brush').call(brush);
    brush.on('end', (evt: d3.D3BrushEvent<unknown>) => {
      const { x_scale, x_series } = this;
      const selection = evt.selection as [number, number];
      if (selection) {
        const domain = [
          x_series[d3.bisectCenter(x_series, x_scale.invert(selection[0]).valueOf())],
          x_series[d3.bisectCenter(x_series, x_scale.invert(selection[1]).valueOf())],
        ]; // 为了取整
        x_scale.domain(domain);
        brush_element.call(brush.move, null);
        this.render_xAxis();
        this.render_Part1();
      } else {
        // x_scale.domain(d3.extent(x_series));
      }
    });

    this.svg.on('dblclick', () => {
      const { x_scale, x_series } = this;
      x_scale.domain(d3.extent(x_series));
      this.render_xAxis();
      this.render_Part1();
    });
  }

  private x_series: number[];
  private x_scale: d3.ScaleTime<number, number, never>;
  private x_format: (date: Date | number) => string;
  private render_xAxis(): void {
    const { svg, data, config } = this;
    const { marginLeft, marginRight, marginBottom, width, height } = config;

    const x_series = (this.x_series ??= data.items.map((item) => item.timestamp));
    const x_scale = (this.x_scale ??= d3.scaleTime(d3.extent(x_series), [marginLeft, width - marginRight]));
    const x_format = (this.x_format ??= d3.timeFormat('%H:%M'));
    const defaultTick = ~~(width / 50);
    const domain = x_scale.domain();
    const x_axis = d3
      .axisBottom(x_scale)
      .ticks(d3.timeMinute.count(domain[0], domain[1]) <= defaultTick ? d3.timeMinute : defaultTick, x_format);
    if (!svg.select('.x_axis').size()) {
      svg
        .append('g')
        .attr('class', 'x_axis')
        .attr('transform', `translate(0,${height - marginBottom})`)
        .style('color', '#666')
        .style('font-size', 10)
        .call(x_axis);
    } else {
      svg.select<SVGGElement>('.x_axis').transition().duration(500).call(x_axis);
    }
  }

  private part1_series: number[][];
  private part1_y_scale: d3.ScaleLinear<number, number, never>;
  private render_Part1(): void {
    const { data, config: c, x_series, x_scale } = this;
    const { marginLeft, marginRight, marginTop, marginBottom, width, height } = c;
    const part1 = this.svg.selectAll<SVGGElement, unknown>('.part1').data([undefined]).join('g').attr('class', 'part1');

    /**
     * 裁剪区域
     */
    const part1_bottom = height - marginBottom - Part2_LineHeight * data.part2.length - Part2_MarginTop;
    const clip = part1
      .selectAll('clipPath')
      .data([undefined])
      .join('svg:clipPath')
      .attr('id', 'part1_clip')
      .selectAll('rect')
      .data([undefined])
      .join('svg:rect')
      .attr('width', width - marginLeft - marginRight)
      .attr('height', part1_bottom - marginTop)
      .attr('x', marginLeft)
      .attr('y', marginTop);

    /**
     * 线条数据
     */
    const x_domain = x_scale.domain().map((d) => d.valueOf());
    const items = data.items.filter((item) => item.timestamp >= x_domain[0] && item.timestamp <= x_domain[1]);
    const part1_series = (this.part1_series = data.part1.map((series) => items.map(series.extractor)));

    /**
     * 画 Y轴
     */
    const y_domain = d3.extent([0, 1 + d3.max([d3.max(part1_series.map((s) => d3.max(s))), 10])]);
    const y_scale = (this.part1_y_scale = d3.scaleLinear(y_domain, [part1_bottom, marginTop]));
    const y_axis = d3.axisLeft(y_scale).ticks(height / 80, null);
    if (!part1.selectAll('.y_axis').size()) {
      part1
        .append('g')
        .attr('class', 'y_axis')
        .attr('transform', `translate(${marginLeft},0)`)
        .style('color', '#666')
        .call(y_axis);
    } else {
      part1.select<SVGGElement>('.y_axis').transition().duration(500).call(y_axis);
    }
    part1.select<SVGGElement>('.y_axis').selectAll('.tick .tickline2').remove();
    part1
      .select<SVGGElement>('.y_axis')
      .selectAll('.tick line')
      .clone()
      .attr('class', 'tickline2')
      .attr('x2', width - marginLeft - marginRight)
      .attr('stroke-opacity', 0.1);

    /**
     * 画 线
     */
    part1
      .selectAll<SVGPathElement, number[]>('.series')
      .data(data.part1)
      .join('path')
      .attr('class', 'series')
      .attr('fill', 'none')
      .attr('stroke', (seriesConfig) => seriesConfig.color)
      .attr('stroke-width', Part1_StrokeWidth)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('clip-path', 'url(#part1_clip)')
      .transition()
      .duration(500)
      .attr('d', (seriesConfig, index) => {
        return d3
          .line<DataType['items'][0]>()
          .defined((item) => !isNaN(seriesConfig.extractor(item)))
          .curve(d3.curveMonotoneX)
          .x((item) => x_scale(item.timestamp))
          .y((item) => y_scale(seriesConfig.extractor(item)))(data.items);
      });
  }

  private part2_series: number[][];
  private render_Part2(): void {
    const { data, config: c, x_series, x_scale } = this;
    const { marginLeft, marginRight, marginTop, marginBottom, width, height } = c;
    const part2 = this.svg.append('g');

    /**
     * 散点数据
     */
    this.part2_series = data.part2.map((line) => data.items.map(line.extractor));
    const part2_series = this.part2_series.map((seriesData) => {
      const points: { v: number; i: number }[] = [];
      seriesData.forEach((v, i) => {
        if (v) points.push({ v, i });
      });
      return points;
    });

    /**
     * 画 Y轴
     */
    const part2_length = data.part2.length;
    const part2_top = height - marginBottom - part2_length * Part2_LineHeight;
    const part2_bottom = height - marginBottom;
    const y_scale = d3.scaleLinear([0, part2_length], [part2_bottom, part2_top]);
    const y_axis = d3
      .axisLeft(y_scale)
      .tickValues(data.part2.map((_, i) => i)) // https://stackoverflow.com/questions/44872048/d3-js-how-can-i-create-an-axis-with-custom-labels-and-customs-ticks
      .tickFormat((v) => data.part2[v.valueOf()].title);
    part2
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .style('color', '#666')
      .call(y_axis)
      .call((g) => g.selectAll('.tick text').attr('transform', `translate(0,-${Part2_LineHeight / 2})`));

    /**
     * 画 散点
     * https://d3-graph-gallery.com/graph/scatter_basic.html
     */
    part2_series.forEach((seriesData, index) => {
      const seriesConfig = data.part2[index];
      part2
        .append('g')
        .attr('transform', `translate(0,-${Part2_LineHeight / 2})`)
        .selectAll('circle')
        .data(seriesData)
        .join('circle')
        .attr('cx', (item) => x_scale(x_series[item.i]))
        .attr('cy', y_scale(index))
        .attr('r', 3)
        .style('fill', seriesConfig.color);
    });
  }

  private render_focus(): void {
    const { data, config: c, x_series, x_scale, x_format, part1_series, part2_series, part1_y_scale } = this;
    const focus = this.svg.append('g');

    const focus_line = focus
      .append('line')
      .attr('stroke', '#ccc')
      .attr('stroke-width', '1px')
      .attr('stroke-dasharray', '6 2')
      .attr('y1', 0)
      .attr('y2', c.height);
    const focus_points = focus.append('g');

    const onPointerMove = (event: PointerEvent) => {
      focus.style('display', null);
      const pointer = d3.pointer(event);
      const x_index = d3.bisectCenter(x_series, x_scale.invert(pointer[0]).valueOf());
      const x_line_position = x_scale(x_series[x_index]);
      focus_line.attr('transform', `translate(${x_line_position},0)`);
      focus_points
        .selectAll('.focus-pointer')
        .data<{ y: number; color: string }>(
          part1_series
            .map((s, seriesIndex) => ({ y: part1_y_scale(s[x_index]), color: data.part1[seriesIndex].color }))
            .filter((item) => !isNaN(item.y)),
        )
        .join('circle') // enter append
        .attr('class', 'focus-pointer')
        .attr('fill', 'white')
        .attr('stroke-width', Part1_StrokeWidth)
        .attr('stroke', (item) => item.color)
        .attr('r', '4') // radius
        .attr('cx', x_line_position) // center x passing through your xScale
        .attr('cy', (item) => item.y); // center y through your yScale;

      c.onPointerMove?.(pointer, x_index);
    };

    const onPointerLeave = () => {
      focus.style('display', 'none');
      c.onPointerLeave?.();
      // svg.property('value', null).dispatch('input', { bubbles: true });
    };
    onPointerLeave();
    this.svg
      .on('pointerenter pointermove', onPointerMove)
      .on('pointerleave', onPointerLeave)
      .on('touchstart', (event) => event.preventDefault());
  }
}
