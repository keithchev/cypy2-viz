
import 'tachyons';
import * as d3 from 'd3';

const typeColors = {
    'walk': d3.schemePaired[0], // light blue
    'run': d3.schemePaired[1], // blue
    'hike': d3.schemeCategory10[2], // green
    'ride': d3.schemeCategory10[4], // purple
}

function makeColorMap ({min, max}) {
    return function colorMap (val) {
        val = val < min ? 0 : val - min;
        val = val > max ? (max - min) : val;
        return d3.interpolateRdYlGn(1 - val/(max - min));
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
    },{
        key: 'proximity',
        label: 'Prox',
        render: d => d < 10 ? d.toFixed(1) : d.toFixed(0),
        color: makeColorMap({min: .1, max: 30})
    }
];


function makeTable (container) {

    container.select("table").remove();

    const table = container.append("table");
    const thead = table.append("thead");
    const tbody = table.append("tbody");
    const footer = container.append("div").attr("id", "table-footer-container");

    // hard-coded page size (rows per page)
    const pageSize = 20;

    // the array of activity metadata
    let data, selectedData;

    // the current page and number of pages
    let page = 0, numPages;

    // table sort order and initial sort-by column
    let sortParams = {key: 'date', order: 1};

    // callback when a row is clicked
    let onRowClick = () => undefined;

    // dict of filter functions to select a subset of metadata
    let filters = {};

    // create the column headers
    const th = thead.selectAll('th').data(columnDefs, d => d.key);
    th.exit().remove();
    th.enter().append('th')
      .attr('class', 'table-th')
      .merge(th)
      .text(d => d.label)
      .on('click', columnDef => {
          sortParams.key = columnDef.key;
          sortParams.order = -sortParams.order;
          Table.update();
      });

    // create the footer (page buttons)
    footer.append("div")
          .attr("class", "fl w-25 table-page-button")
          .attr("id", "table-back-button")
          .text("<<")
          .on("click", () => {
              if (page===0) return;
              page -= 1;
              Table.update();
          });

    footer.append('div')
          .attr("class", "fl w-50")
          .attr("id", "table-current-page");

    footer.append("div")
          .attr("class", "fl w-25 table-page-button")
          .attr("id", "table-forward-button")
          .text(">>")
          .on("click", () => {
              if (page===(numPages - 1)) return;
              page += 1;
              Table.update();
          });


    function Table () {}

    Table.data = function (val) {
        if (!arguments.length) return data;
        page = 0;
        data = val;
        return Table;
    }

    Table.page = function (val) {
        if (!arguments.length) return page;
        page = val;
        return Table;
    }

    Table.sortParams = function (newParams) {
        if (!arguments.length) return sortParams;
        page = 0;
        sortParams = {...sortParams, ...newParams};
        return Table;
    }

    Table.onRowClick = function (fn) {
        if (!arguments.length) return onRowClick;
        onRowClick = fn;
        return Table;
    }

    Table.onUpdate = function (fn) {
        if (!arguments.length) return onUpdate;
        onUpdate = fn;
        return Table;
    }

    Table.updateFilter = function (name, fn) {
        page = 0;
        filters[name] = fn;
        return Table;
    }

    Table.merge = function (newData, key) {
        let rowsByKey = {}
        newData.forEach(row => rowsByKey[row[key]] = row);
        data = data.map(row => ({...row, ...rowsByKey[row[key]]}));
        return Table;
    }

    Table.sort = function () {
        selectedData.sort((row1, row2) => {
            const [val1, val2] = [row1[sortParams.key], row2[sortParams.key]]; 
            if (val1===null || val1===undefined) return -sortParams.order;
            if (val2===null || val2===undefined) return sortParams.order;
            if (val1 < val2) {
                return sortParams.order;
            } else {
                return -sortParams.order;
            }
        });
    }

    Table.update = function () {

        // apply all of the filters
        selectedData = [...data];
        Object.values(filters).map(filter => {
            selectedData = selectedData.filter(filter);
        });

        Table.sort();

        numPages = Math.ceil(selectedData.length / pageSize);
        const displayedData = selectedData.slice(page*pageSize, (page + 1)*pageSize);

        let tr = tbody.selectAll('tr').data(displayedData, d => d.activity_id);
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
                if (row[d.key]===undefined || row[d.key]===null) {
                    return {html: 'NA', color: '#999'};
                }
                return {
                    html: d.render ? d.render(row[d.key]) : row[d.key],
                    color: d.color ? d.color(row[d.key]) : '#fff',
                };
            });
        });

        td.exit().remove();
        td.enter().append('td')
          .attr('class', 'table-td')
          .merge(td)
          .html(d => d.html)
          .style('background-color', d => {
            if (!d.color) return 'white';
            let color = d3.color(d.color);
            color.opacity = .5;
            return color;
          });

        d3.select("#table-current-page").text(`Page ${page + 1}/${numPages}`);
        onUpdate(displayedData);        
        return Table;
    }

    return Table;
}


export default makeTable;
