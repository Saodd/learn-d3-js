/**
 * https://codepen.io/savemuse/pen/bgQQxp
 */

var data = [
  {
    timescale: '早',
    totalAmount: 20,
    totalProfit: 200,
    totalRevenue: 400,
  },
  {
    timescale: '午',
    totalAmount: 40,
    totalProfit: 300,
    totalRevenue: 600,
  },
  {
    timescale: '晚',
    totalAmount: 70,
    totalProfit: 100,
    totalRevenue: 800,
  },
  {
    timescale: '深夜',
    totalAmount: 100,
    totalProfit: 800,
    totalRevenue: 900,
  },
];
var trendsText = { totalAmount: '銷售數量', totalProfit: '總收入金額', totalRevenue: '總分潤金額' };

// set the dimensions and margins of the graph
var margin = { top: 20, right: 80, bottom: 30, left: 50 },
  svg = d3.select('svg'),
  width = +svg.attr('width') - margin.left - margin.right,
  height = +svg.attr('height') - margin.top - margin.bottom;
var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// set the ranges
var x = d3.scaleBand().rangeRound([0, width]).padding(1),
  y = d3.scaleLinear().rangeRound([height, 0]),
  z = d3.scaleOrdinal(['#036888', '#0D833C', '#D2392A']);

// define the line
var line = d3
  .line()
  .x(function (d) {
    return x(d.timescale);
  })
  .y(function (d) {
    return y(d.total);
  });

// scale the range of the data
z.domain(
  d3.keys(data[0]).filter(function (key) {
    return key !== 'timescale';
  }),
);

var trends = z.domain().map(function (name) {
  return {
    name: name,
    values: data.map(function (d) {
      return {
        timescale: d.timescale,
        total: +d[name],
      };
    }),
  };
});

x.domain(
  data.map(function (d) {
    return d.timescale;
  }),
);
y.domain([
  0,
  d3.max(trends, function (c) {
    return d3.max(c.values, function (v) {
      return v.total;
    });
  }),
]);

// Draw the legend
var legend = g.selectAll('g').data(trends).enter().append('g').attr('class', 'legend');

legend
  .append('rect')
  .attr('x', width - 20)
  .attr('y', function (d, i) {
    return height / 2 - (i + 1) * 20;
  })
  .attr('width', 10)
  .attr('height', 10)
  .style('fill', function (d) {
    return z(d.name);
  });

legend
  .append('text')
  .attr('x', width - 8)
  .attr('y', function (d, i) {
    return height / 2 - (i + 1) * 20 + 10;
  })
  .text(function (d) {
    return trendsText[d.name];
  });

// Draw the line
var trend = g.selectAll('.trend').data(trends).enter().append('g').attr('class', 'trend');

trend
  .append('path')
  .attr('class', 'line')
  .attr('d', function (d) {
    return line(d.values);
  })
  .style('stroke', function (d) {
    return z(d.name);
  });

// Draw the empty value for every point
var points = g.selectAll('.points').data(trends).enter().append('g').attr('class', 'points').append('text');

// Draw the circle
trend
  .style('fill', '#FFF')
  .style('stroke', function (d) {
    return z(d.name);
  })
  .selectAll('circle.line')
  .data(function (d) {
    return d.values;
  })
  .enter()
  .append('circle')
  .attr('r', 5)
  .style('stroke-width', 3)
  .attr('cx', function (d) {
    return x(d.timescale);
  })
  .attr('cy', function (d) {
    return y(d.total);
  });

// trend
//   .selectAll("circle.text")
//   .data(function(d){ return d.values })
//   .enter()
//   .append('text')
//   .attr('x', function(d) { return x(d.timescale) + 15; })
//   .attr('y', function(d) { return y(d.total); })
//   .text(function(d) { return d.total; });

// Draw the axis
g.append('g')
  .attr('class', 'axis axis-x')
  .attr('transform', 'translate(0, ' + height + ')')
  .call(d3.axisBottom(x));

g.append('g').attr('class', 'axis axis-y').call(d3.axisLeft(y).ticks(10));

var focus = g.append('g').attr('class', 'focus').style('display', 'none');

focus.append('line').attr('class', 'x-hover-line hover-line').attr('y1', 0).attr('y2', height);

svg
  .append('rect')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  .attr('class', 'overlay')
  .attr('width', width)
  .attr('height', height)
  .on('mouseover', mouseover)
  .on('mouseout', mouseout)
  .on('mousemove', mousemove);

var timeScales = data.map(function (name) {
  return x(name.timescale);
});

function mouseover() {
  focus.style('display', null);
  d3.selectAll('.points text').style('display', null);
}
function mouseout() {
  focus.style('display', 'none');
  d3.selectAll('.points text').style('display', 'none');
}
function mousemove() {
  var i = d3.bisect(timeScales, d3.mouse(this)[0], 1);
  var di = data[i - 1];
  focus.attr('transform', 'translate(' + x(di.timescale) + ',0)');
  d3.selectAll('.points text')
    .attr('x', function (d) {
      return x(di.timescale) + 15;
    })
    .attr('y', function (d) {
      return y(d.values[i - 1].total);
    })
    .text(function (d) {
      return d.values[i - 1].total;
    })
    .style('fill', function (d) {
      return z(d.name);
    });
}
