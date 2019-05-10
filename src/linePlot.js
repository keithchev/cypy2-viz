
import 'tachyons';
import * as d3 from 'd3';



function makeLinePlot (container, definition) {

    container = d3.select(container);
    container.select("svg").remove();

    const props = {
        fullHeight: 120,
        padL: 30,
        padR: 0,
        padT: 25,
        padB: 10,
    }

    let lineData, brush;
    let xDomain = null, yDomain;

    // external callback to execute when mouse moves
    let onMouseMoveCallback = (mouseIndex) => {};
    let onBrushCallback = (xDomain) => {};

    const svg = container.append("svg");
    props.fullWidth = parseInt(container.style('width'));
    props.width = props.fullWidth - props.padL - props.padR;
    props.height = props.fullHeight - props.padT - props.padB;

    const xScale = d3.scaleLinear().range([0, props.width]);
    const yScale = d3.scaleLinear().range([props.height, 0]);

    const line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y));
    const yAxis = d3.axisLeft(yScale);    

    // SVG itself
    svg.attr("width", props.fullWidth)
       .attr("height", props.fullHeight)
       .attr("id", definition.key);

    // clip path for brushing
    svg.append("defs")
       .append("clipPath")
       .attr("id", "line-plot-clip-path")
       .append("rect")
       .attr("width", props.width)
       .attr("height", props.height);
//       .attr("transform", `translate(${props.padL}, ${props.padT})`);

    // plot label
    svg.append("text")
       .attr("class", "line-plot-label")
       .attr("transform", "translate(0, 15)")
       .attr("text-anchor", "start")
       .text(definition.label);

    svg.append("text")
       .attr('class', 'line-plot-value')
       .attr("transform", `translate(${props.fullWidth}, 15)`)
       .attr("text-anchor", "end");
       
    // group for plot paths and axes
    const g = svg.append("g");
    g.attr("transform", `translate(${props.padL}, ${props.padT})`);
    
    // primary line plot path
    g.append("path")
     .attr("class", "line-plot-clippable-path line-plot-data-path")
     .attr("id", "data-path")
     .attr("stroke", definition.color || "none")
     .attr("fill", definition.fillColor || "none");

    // mean plot path
    g.append("path")
     .attr("class", "line-plot-clippable-path line-plot-mean-path")
     .attr("id", "mean-path");

     // mouse position
    g.append("path")
     .attr("class", "line-plot-mouse-path");
    
     if (definition.brushable) {
        brush = d3.brushX()
                  .extent([[0, 0], [props.width, props.height]])
                  .on("start brush end", brushed);

        g.append("g")
         .attr("class", "line-plot-brush")
         .call(brush);
     }

     // y-axis group
    g.append("g").attr("class", "axis").attr("id", "y-axis");

     // bind event listeners 
     // (use 'mouseleave' instead of 'mouseout' to prevent bubbling up/down)
    svg.on("mousemove", onMouseMove);
    svg.on("mouseleave", onMouseOut);


    function LinePlot () {}

    LinePlot.definition = () => definition;

    LinePlot.xDomain = function (val) {
        if (!arguments.length) return xDomain;
        xDomain = !!val && val[0]!==val[1] ? val : null;
        return LinePlot;
    }

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

    LinePlot.onBrushCallback = function (fn) {
        if (!arguments.length) return onMouseMoveCallback;
        onBrushCallback = fn;
        return LinePlot;
    }

    
    LinePlot.update = function () {

        if (lineData===undefined) {
            svg.select("#data-path").attr("d", d => null);
            svg.select("#mean-path").attr("d", d => null);   
            return LinePlot;             
        }

        let filter = d => true;
        if (xDomain) {
            filter = d => (d.x > xDomain[0]) && (d.x < xDomain[1]);
        } else {
            xDomain = [lineData[0].x, lineData[lineData.length - 1].x];
        }

        const croppedLineData = lineData.filter(filter);
        const [yMin, yMax] = [d3.min(lineData, d => d.y), d3.max(lineData, d => d.y)];
        yDomain = definition.range==='auto' ? [yMin, yMax] : definition.range;

        xScale.domain(xDomain);
        yScale.domain(yDomain);

        if (definition.fillColor) {
            lineData = [{x: xDomain[0], y: yMin}, ...lineData, {x: xDomain[1], y: yMin}];
        }
        svg.select("#data-path").attr("d", d => line(lineData));

        let tickValues = yScale.domain();

        // mean value
        if (!definition.hideMean) {
            const meanValue = d3.mean(croppedLineData, d => d.y);
            const meanLineData = [
                {x: xDomain[0], y: meanValue},
                {x: xDomain[1], y: meanValue}];
            tickValues = tickValues.concat(meanValue);
            svg.select("#mean-path").attr("d", d => line(meanLineData));
        }

        yAxis.tickValues(tickValues)
             .tickFormat(definition.tickFormat)
             .tickSize(0, 0);

        svg.select("#y-axis").call(yAxis);    
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

    function brushed () {
        const range = d3.event.selection;
        const xDomain = (range===null) ? xScale.domain() : range.map(xScale.invert);
        onBrushCallback(xDomain);
    }

    return LinePlot;
}

export default makeLinePlot;
