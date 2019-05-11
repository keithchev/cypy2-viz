import * as d3 from 'd3';


function lightenColor(color, alpha){
    // simulates an opacity of alpha against a white background

    if (!color) return null;
    color = d3.color(color);

    ["r", "g", "b"].map(channel => {
        color[channel] += (1 - alpha)*255;
        color[channel] = color[channel] > 255 ? 255 : color[channel];
        color[channel] = color[channel] < 0 ? 0 : color[channel];
    });
    return color;
}


export default {lightenColor};
