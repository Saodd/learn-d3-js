import * as d3 from 'd3';

type LineChartConfig = {
  width: number;
  height: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
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
  }

  private x_series: number[];
  private x_scale: d3.ScaleTime<number, number, never>;
  private x_format: (date: Date | number) => string;
  private render_xAxis(): void {
    const { svg, data, config } = this;
    const { marginLeft, marginRight, marginBottom, width, height } = config;

    const x_series = (this.x_series = data.items.map((item) => item.timestamp));
    const x_scale = (this.x_scale = d3.scaleTime(d3.extent(x_series), [marginLeft, width - marginRight]));
    const x_format = (this.x_format = d3.timeFormat('%H:%M'));
    const defaultTick = ~~(width / 50);
    const xAxis = d3.axisBottom(x_scale).ticks(x_series.length <= defaultTick ? d3.timeMinute : defaultTick, x_format);
    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .style('font-size', 10)
      .call(xAxis);
  }

  private part1_series: number[][];
  private part1_y_scale: d3.ScaleLinear<number, number, never>;
  private render_Part1(): void {
    const { data, config: c, x_series, x_scale } = this;
    const { marginLeft, marginRight, marginTop, marginBottom, width, height } = c;
    const part1 = this.svg.append('g');

    /**
     * 裁剪区域
     */
    const part1_bottom = height - marginBottom - Part2_LineHeight * data.part2.length - Part2_MarginTop;
    const lines_clip = part1
      .append('defs')
      .append('svg:clipPath')
      .attr('id', 'lines_clip')
      .append('svg:rect')
      .attr('x', marginLeft)
      .attr('y', marginTop)
      .attr('width', width - marginLeft - marginRight)
      .attr('height', part1_bottom - marginTop);
    const lines_group = part1.append('g').attr('clip-path', 'url(#lines_clip)');

    /**
     * 线条数据
     */
    const part1_series = (this.part1_series = data.part1.map((line) => data.items.map(line.extractor)));

    /**
     * 画 Y轴
     */
    const y_domain = d3.extent([0, d3.max([d3.max(part1_series.map((s) => d3.max(s))) * 1.1, 10])]);
    const y_scale = (this.part1_y_scale = d3.scaleLinear(y_domain, [part1_bottom, marginTop]));
    const y_axis = d3.axisLeft(y_scale).ticks(height / 50, null);
    part1
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
     * 画 线
     */
    part1_series.forEach((seriesData, index) => {
      const defaultStrokeWidth = 1.5;
      const seriesConfig = data.part1[index];
      const line_defined = d3.map(seriesData, (d) => !isNaN(d));
      const line = d3
        .line<number>()
        .defined((i) => line_defined[i])
        .curve(d3.curveLinear) // https://github.com/d3/d3/blob/main/API.md#curves
        .x((i) => x_scale(x_series[i]))
        .y((i) => y_scale(seriesData[i]));
      const line1_path = lines_group
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', seriesConfig.color)
        .attr('stroke-width', defaultStrokeWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line(seriesData.map((_, i) => i)));
      line1_path
        .on('pointerenter pointermove', () => {
          line1_path.attr('stroke-width', defaultStrokeWidth * 2);
        })
        .on('pointerleave', () => {
          line1_path.attr('stroke-width', defaultStrokeWidth);
        });
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
      .attr('stroke', '#B74779')
      .attr('stroke-width', '1px')
      .attr('y1', 0)
      .attr('y2', c.height);
    const focus_points = focus.append('g');
    const focus_tooltip = focus.append('g').style('pointer-events', 'none');

    const onPointerMove = (event: PointerEvent) => {
      focus.style('display', null);
      const pointer = d3.pointer(event);
      const x_index = d3.bisectCenter(x_series, x_scale.invert(pointer[0]).valueOf());
      const x_line_position = x_scale(x_series[x_index]);
      focus_line.attr('transform', `translate(${x_line_position},0)`);
      focus_points
        .selectAll('.focus-pointer')
        .data<{ y: number }>(
          part1_series
            .map((s) => s[x_index])
            .filter((y) => !!y)
            .map((y) => ({ y: part1_y_scale(y) })),
        )
        .join('circle') // enter append
        .attr('class', 'focus-pointer')
        .attr('fill', 'white')
        .attr('stroke-width', '1')
        .attr('stroke', 'black')
        .attr('r', '4') // radius
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
            .data(
              [
                x_format(x_series[x_index]),
                ...part1_series.map((s, index) => {
                  const value = s[x_index];
                  if (value) {
                    const seriesConfig = data.part1[index];
                    return `${seriesConfig.title}: ${seriesConfig.formatter(value)}`;
                  }
                  return null;
                }),
                ...part2_series.map((s, index) => {
                  const value = s[x_index];
                  const seriesConfig = data.part2[index];
                  return `${seriesConfig.title}: ${seriesConfig.formatter(value || 0)}`;
                }),
              ].filter((v) => !!v),
            )
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
    this.svg
      .on('pointerenter pointermove', onPointerMove)
      .on('pointerleave', onPointerLeave)
      .on('touchstart', (event) => event.preventDefault());
  }
}
