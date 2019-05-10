
import 'tachyons';
import * as d3 from 'd3';



function makeLinePlot (container, definition) {

    container = d3.select(container);
    container.select("svg").remove();

    const props = {
        height: 120,
        padL: 30,
        padR: 0,
        padT: 25,
        padB: 10,
    }

    // the array of activity metadata
    let data = [];

    const svg = container.append("svg");
    const width = parseInt(container.style('width'));

    const xScale = d3.scaleLinear().range([0, width - props.padL - props.padR]);
    const yScale = d3.scaleLinear().range([props.height - props.padT - props.padB, 0]);

    const line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y));
    const yAxis = d3.axisLeft(yScale);    

    // SVG itself
    svg.attr("width", width)
       .attr("height", props.height)
       .attr("id", definition.key);

    // clip path for brushing
    svg.append("defs")
       .append("clipPath")
       .attr("id", "clip")
       .append("rect")
       .attr("width", width - props.padL - props.padR)
       .attr("height", props.height);

    // plot label
    svg.append("text")
       .attr("transform", "translate(0, 15)")
       .attr("text-anchor", "start")
       .attr("style", "font-size: 12px; font-weight: bold;")
       .text(definition.label);

    // group for plot paths and axes
    const g = svg.append("g");
    g.attr("transform", `translate(${props.padL}, ${props.padT})`);
    
    // y-axis group
    g.append("g").attr("class", "axis").attr("id", "y-axis");

    // primary line plot path
    g.append("path")
     .attr("class", "line-plot-path")
     .attr("id", "data-path")
     .attr("stroke", definition.color)
     .attr("stroke-width", 1)
     .attr("fill", "none");

    // mean plot path
    g.append("path")
     .attr("class", "line-plot-path")
     .attr("id", "mean-path")
     .attr("stroke", "#000")
     .style("stroke-dasharray", "3,3")
     .attr("stroke-width", 1)
     .attr("fill", "none");

    g.append("path").attr("class", "mouse-position-path");



    function LinePlot () {}

    LinePlot.definition = () => definition;

    LinePlot.data = function ({x, y}) {
        if (!arguments.length) return data;
        data = x.map((val, ind) => ({x: val, y: y[ind]}));
        return LinePlot;
    }


    LinePlot.update = function () {

        let xDomain = [data[0].x, data[data.length - 1].x];
        let yDomain = [d3.min(data, d => d.y), d3.max(data, d => d.y)];
        yDomain = definition.range==='auto' ? yDomain : definition.range;

        xScale.domain(xDomain);
        yScale.domain(yDomain);

        // mean value
        const meanValue = d3.mean(data, d => d.y);
        const meanData = [
            {x: xDomain[0], y: meanValue},
            {x: xDomain[1], y: meanValue}
        ];

        yAxis.tickValues(yScale.domain().concat(meanValue))
             .tickFormat(definition.tickFormat)
             .tickSize(0, 0);

        svg.select("#y-axis").call(yAxis);
        svg.select("#data-path").attr("d", d => line(data));
        svg.select("#mean-path").attr("d", d => line(meanData));
    
        return LinePlot;
    }

    return LinePlot;
}

export default makeLinePlot;
