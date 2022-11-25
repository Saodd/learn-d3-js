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
const Part2_CircleRadius = 3;

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

  private zooming = false;
  private zooming_x_index: [number, number] = null;
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
      this.zooming = true;
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
        this.render_Part2();
      } else {
        // x_scale.domain(d3.extent(x_series));
      }
    });

    this.svg.on('dblclick', () => {
      this.zooming = false;
      this.zooming_x_index = null;
      const { x_scale, x_series } = this;
      x_scale.domain(d3.extent(x_series));
      this.render_xAxis();
      this.render_Part1();
      this.render_Part2();
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
    const part1_series = data.part1.map((series) => items.map(series.extractor));

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
    const part1_series_line_builder = (
      seriesConfig: DataType['part1'][0],
      defined: (item: DataType['items'][0], index: number) => boolean,
    ) => {
      return d3
        .line<DataType['items'][0]>()
        .defined(defined)
        .curve(d3.curveMonotoneX)
        .x((item) => x_scale(item.timestamp))
        .y((item) => y_scale(seriesConfig.extractor(item)));
    };
    const part1_series_elements = part1
      .selectAll<SVGPathElement, number[]>('.series')
      .data(data.part1)
      .join('path')
      .attr('class', 'series')
      .attr('fill', 'none')
      .attr('stroke', (seriesConfig) => seriesConfig.color)
      .attr('stroke-width', Part1_StrokeWidth)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('clip-path', 'url(#part1_clip)');
    if (this.zooming) {
      part1_series_elements
        .transition()
        .duration(500)
        .attr('d', (seriesConfig, i) => {
          const [z0, z1] = this.zooming_x_index || [0, x_series.length - 1];
          return part1_series_line_builder(
            seriesConfig,
            (item, i) => z0 <= i && i <= z1 && !isNaN(seriesConfig.extractor(item)),
          )(data.items);
        })
        .end()
        .then(() => {
          const z0 = d3.max([d3.bisectLeft(x_series, x_domain[0]) - 1, 0]);
          const z1 = d3.min([d3.bisectRight(x_series, x_domain[1]) + 1, x_series.length - 1]);
          part1_series_elements.attr('d', (seriesConfig) => {
            return part1_series_line_builder(
              seriesConfig,
              (item, i) => z0 <= i && i <= z1 && !isNaN(seriesConfig.extractor(item)),
            )(data.items);
          });
          this.zooming_x_index = [z0, z1];
        });
    } else {
      part1_series_elements.attr('d', (seriesConfig) => {
        return part1_series_line_builder(seriesConfig, (item) => !isNaN(seriesConfig.extractor(item)))(data.items);
      });
    }
  }

  private render_Part2(): void {
    const { data, config: c, x_series, x_scale } = this;
    const { marginLeft, marginRight, marginTop, marginBottom, width, height } = c;
    const part2 = this.svg.selectAll<SVGGElement, unknown>('.part2').data([undefined]).join('g').attr('class', 'part2');

    /**
     * 画 Y轴
     */
    const part2_length = data.part2.length;
    const part2_top = height - marginBottom - part2_length * Part2_LineHeight;
    const part2_bottom = height - marginBottom;
    const y_scale = d3.scaleLinear([0, part2_length], [part2_bottom, part2_top]);
    if (!part2.selectAll('.y_axis').size()) {
      const y_axis = d3
        .axisLeft(y_scale)
        .tickValues(data.part2.map((_, i) => i)) // https://stackoverflow.com/questions/44872048/d3-js-how-can-i-create-an-axis-with-custom-labels-and-customs-ticks
        .tickFormat((v) => data.part2[v.valueOf()].title);
      part2
        .append('g')
        .attr('class', 'y_axis')
        .attr('transform', `translate(${marginLeft},0)`)
        .style('color', '#666')
        .call(y_axis)
        .call((g) => g.selectAll('.tick text').attr('transform', `translate(0,-${Part2_LineHeight / 2})`));
    }

    /**
     * 画 散点
     * https://d3-graph-gallery.com/graph/scatter_basic.html
     */
    const part2_series_elements = part2
      .selectAll<SVGGElement, number[]>('.series')
      .data(data.part2)
      .join('g')
      .attr('class', 'series')
      .attr('transform', (_, i) => `translate(0,${y_scale(i) - Part2_LineHeight / 2})`)
      .each((seriesConfig, index, groups) => {
        const { extractor } = seriesConfig;
        const x_indexes: number[] = [];
        data.items.forEach((item, i) => {
          const value = extractor(item);
          if (value) {
            x_indexes.push(i);
          }
        });
        const circle_elements = d3
          .select(groups[index])
          .selectAll('circle')
          .data(x_indexes)
          .join('circle')
          .attr('cy', 0)
          .attr('r', Part2_CircleRadius)
          .style('fill', seriesConfig.color);
        circle_elements
          .transition()
          .duration(500)
          .attr('cx', (x_index) => x_scale(x_series[x_index]));
      });
  }

  private render_focus(): void {
    const { config: c } = this;
    const focus = this.svg.append('g').attr('class', 'focus');

    const focus_line = focus
      .append('line')
      .attr('stroke', '#ccc')
      .attr('stroke-width', '1px')
      .attr('stroke-dasharray', '6 2')
      .attr('y1', 0)
      .attr('y2', c.height);
    const focus_points = focus.append('g');

    const onPointerMove = (event: PointerEvent) => {
      const { data, config: c, x_series, x_scale, part1_y_scale } = this;
      focus.style('display', null);
      const pointer = d3.pointer(event);
      const x_index = d3.bisectCenter(x_series, x_scale.invert(pointer[0]).valueOf());
      const x_line_position = x_scale(x_series[x_index]);
      const x_item = data.items[x_index];
      focus_line.attr('transform', `translate(${x_line_position},0)`);
      focus_points
        .selectAll('.focus-pointer')
        .data(data.part1.filter((seriesConfig) => !isNaN(seriesConfig.extractor(x_item))))
        .join('circle')
        .attr('class', 'focus-pointer')
        .attr('fill', 'white')
        .attr('stroke-width', Part1_StrokeWidth)
        .attr('stroke', (seriesConfig) => seriesConfig.color)
        .attr('r', '4')
        .attr('cx', x_line_position)
        .attr('cy', (seriesConfig) => part1_y_scale(seriesConfig.extractor(x_item)));

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
