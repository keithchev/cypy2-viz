
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

    let xDomain, yDomain, lineData;

    // external callback to execute when mouse moves
    let onMouseMoveCallback = (mouseIndex) => {};

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
       .attr("class", "line-plot-label")
       .attr("transform", "translate(0, 15)")
       .attr("text-anchor", "start")
       .text(definition.label);

    svg.append("text")
       .attr('class', 'line-plot-value')
       .attr("transform", `translate(${width}, 15)`)
       .attr("text-anchor", "end");
       

    // group for plot paths and axes
    const g = svg.append("g");
    g.attr("transform", `translate(${props.padL}, ${props.padT})`);
    
    // y-axis group
    g.append("g").attr("class", "axis").attr("id", "y-axis");

    // primary line plot path
    g.append("path")
     .attr("class", "line-plot-data-path")
     .attr("id", "data-path")
     .attr("stroke", definition.color);

    // mean plot path
    g.append("path")
     .attr("class", "line-plot-mean-path")
     .attr("id", "mean-path");

    g.append("path")
     .attr("class", "line-plot-mouse-path");
    
     // bind event listeners 
     // (use 'mouseleave' instead of 'mouseout' to prevent bubbling up/down)
    svg.on("mousemove", onMouseMove);
    svg.on("mouseleave", onMouseOut);


    function LinePlot () {}

    LinePlot.definition = () => definition;

    LinePlot.lineData = function ({x, y}) {
        if (!arguments.length) return lineData;
        if (y===undefined) {
            lineData = undefined;
        } else {
            lineData = x.map((val, ind) => ({x: val, y: y[ind]}));
        }
        return LinePlot;
    }

    LinePlot.onMouseMoveCallback = function (fn) {
        if (!arguments.length) return onMouseMoveCallback;
        onMouseMoveCallback = fn;
        return LinePlot;
    }


    LinePlot.update = function () {
        if (lineData===undefined) {
            svg.select("#data-path").attr("d", d => null);
            svg.select("#mean-path").attr("d", d => null);   
            return LinePlot;             
        }

        xDomain = [lineData[0].x, lineData[lineData.length - 1].x];
        yDomain = [d3.min(lineData, d => d.y), d3.max(lineData, d => d.y)];
        yDomain = definition.range==='auto' ? yDomain : definition.range;

        xScale.domain(xDomain);
        yScale.domain(yDomain);

        // mean value
        const meanValue = d3.mean(lineData, d => d.y);
        const meanLineData = [
            {x: xDomain[0], y: meanValue},
            {x: xDomain[1], y: meanValue}
        ];

        yAxis.tickValues(yScale.domain().concat(meanValue))
             .tickFormat(definition.tickFormat)
             .tickSize(0, 0);

        svg.select("#y-axis").call(yAxis);
        svg.select("#data-path").attr("d", d => line(lineData));
        svg.select("#mean-path").attr("d", d => line(meanLineData));
    
        return LinePlot;
    }


    LinePlot.updateMousePosition = function (mouseIndex) {
        if (lineData===undefined) return;

        const mouseLineData = [
            {x: lineData[mouseIndex].x, y: yDomain[0]},
            {x: lineData[mouseIndex].x, y: yDomain[1]}];

        svg.select(".line-plot-mouse-path")
           .attr("d", line(mouseLineData))
           .attr("visibility", "visible");

        svg.select(".line-plot-value")
           .text(`${definition.tickFormat(lineData[mouseIndex].y)} ${definition.units}`);

    }


    function onMouseMove () {
        if (lineData===undefined) return;
        const mousePosition = d3.mouse(svg.node())[0] - props.padL;
        const dists = lineData.map(d => Math.abs(d.x - xScale.invert(mousePosition)));
        const mouseIndex = dists.indexOf(Math.min.apply(null, dists));
        onMouseMoveCallback(mouseIndex);
    }

    function onMouseOut () {
        d3.selectAll('.line-plot-mouse-path').attr('visibility', 'hidden');
    }

    return LinePlot;
}

export default makeLinePlot;
