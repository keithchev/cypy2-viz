
import 'tachyons';
import * as d3 from 'd3';

const typeColors = {
    'run': '#33a02c',
    'ride': '#6a3d9a',
    'hike': '#bbb',
    'walk': '#b2df8a',
}

function makeColorMap ({min, max}) {
    return function colorMap (val) {
        val = val < min ? 0 : val - min;
        let color = d3.interpolateRdYlBu(1 - val/(max - min));
        return val ? color : '#999';
    }
}

const columnDefs = [
    {
        key: 'activity_type',
        label: 'Type',
        color: d => typeColors[d],
    },{
        key: 'date',
        label: 'Date',
        render: d => d3.timeFormat('%a %b %d %Y')(d),
    },{
        key: 'total_elapsed_time',
        label: 'Time',
        render: d => {
            const hours = Math.floor(d/3600);
            const minutes = Math.floor((d - hours*3600)/60);
            return `${hours}:${d3.format('02.0f')(minutes)}`;
        },
        color: makeColorMap({min: 0, max: 3600*3}),
    },{
        key: 'total_distance',
        label: 'Dist',
        render: d => d.toFixed(1),
        color: makeColorMap({min: 0, max: 60}),
    },{
        key: 'total_ascent',
        label: 'Vert',
        render: d => d.toFixed(),
        color: makeColorMap({min: 0, max: 7000}),
    },
];


function MakeTable (container) {

    container.select("table").remove();

    const table = container.append("table");
    const thead = table.append("thead");
    const tbody = table.append("tbody");

    // the array of activity metadata
    let data = [];

    // table sort order
    let orderFlag = 1;

    // callback when a row is clicked
    let onRowClick = () => undefined;

    // dict of filter functions to select a subset of metadata
    let filters = {};

    const th = thead.selectAll('th').data(columnDefs, d => d.key);

    th.exit().remove();
    th.enter().append('th')
      .attr('class', 'table-th')
      .merge(th)
      .text(d => d.label)
      .on('click', columnDef => {
          orderFlag = -orderFlag;
          d3.selectAll('.table-tr').sort((row1, row2) => {
              if (row1[columnDef.key] < row2[columnDef.key]) {
                  return orderFlag;
              } else {
                  return -orderFlag;
              }
          })
      });


    function Table () {}

    Table.data = function (val) {
        if (!arguments.length) return data;
        data = val;
        return Table;
    }

    Table.onRowClick = function (fn) {
        onRowClick = fn;
        return Table;
    }

    Table.updateFilter = function (name, fn) {
        filters[name] = fn;
        return Table;
    }

    Table.update = function () {

        let selectedData = [...data];
        Object.values(filters).map(filter => {
            selectedData = selectedData.filter(filter);
        });

        let tr = tbody.selectAll('tr').data(selectedData, d => d.activity_id);
        tr.exit().remove();

        tr = tr.enter().append('tr')
               .attr('class', 'table-tr')
               .on('click', function (d) {
                   d3.selectAll('.table-tr').classed('table-tr-selected', false);
                   d3.select(this).classed('table-tr-selected', true);
                   onRowClick(d);
               })
               .merge(tr);

        let td = tr.selectAll('td').data(row => {
            return columnDefs.map(d => {
                return {
                    html: d.render ? d.render(row[d.key]) : row[d.key],
                    color: d.color ? d.color(row[d.key]) : '#fff',
                };
            });
        });

        td.exit().remove();
        td.enter().append('td')
          .attr('class', 'table-td')
          .style('background-color', d => {
              let color = d3.color(d.color);
              color.opacity = .5;
              return color;
          })
          .merge(td)
          .html(d => d.html);
        
        return Table;
    }

    return Table;
}


export default MakeTable;
