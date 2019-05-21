
import * as d3 from 'd3';

function constructUrl({endpoint, ...kwargs}) {

    const root = 'http://localhost:5000';
    const args = Object.entries(kwargs).map(([key, value]) => `${key}=${value}`);
    const url = `${root}${endpoint}?${args.join('&')}`;
    return url;
}

const api = {
    url: constructUrl,
};


function toFixed(val, n) {
    if ((typeof val)!=='number') return 'NaN';
    return val.toFixed(n);
}

function renderSeconds (seconds, showSeconds = false) {
    const hours = Math.floor(seconds/3600);
    const minutes = Math.floor((seconds - hours*3600)/60);
    seconds = seconds - hours*3600 - minutes*60;
    let str = `${hours}:${d3.format('02.0f')(minutes)}`;
    str = showSeconds ? `${str}:${d3.format('02.0f')(seconds)}` : str;
    return str;
}

function makeColorMap ({min, max}) {
    return function colorMap (val) {
        val = val < min ? 0 : val - min;
        val = val > max ? (max - min) : val;
        return d3.interpolateRdYlGn(1 - val/(max - min));
    }
}

const activityTypeColors = {
    'walk': d3.schemePaired[0], // light blue
    'run': d3.schemePaired[1], // blue
    'hike': d3.schemeCategory10[2], // green
    'ride': d3.schemeCategory10[4], // purple
}

const tableColumnDefinitions = [
    {
        key: 'activity_type',
        label: 'Type',
        color: d => activityTypeColors[d],
    },{
        key: 'date',
        label: 'Date',
        render: d => d3.timeFormat('%a %b %d %Y')(d),
    },{
        key: 'total_elapsed_time',
        label: 'Time',
        render: d => renderSeconds(d),
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


const statsDefinitions = [
    {   
        key: "moving_time",
        label: 'Moving time',
        render: d => renderSeconds(d, true),
    },{
        key: "total_time",
        label: 'Total time',
        render: d => renderSeconds(d, true),
    },{
        key: "total_distance",
        label: "Distance",
        units: "miles",
        render: d => toFixed(d, 2),
    },{
        key: "average_speed",
        label: "Average speed",
        units: "mph",
        render: d => toFixed(d, 2),
    },{
        key: "elevation_gain",
        label: "Elevation gain",
        units: "feet",
        render: d => toFixed(d, 0),
    },{
        key: "elevation_loss",
        label: "Elevation loss",
        units: "feet",
        render: d => toFixed(d, 0),
    },{
        key: "average_vam",
        label: "Average VAM",
        units: "m/h",
        render: d => toFixed(d, 0),
    },{
        key: "average_grade",
        label: "Average grade",
        units: "%",
        render: d => toFixed(d, 2),
    },{
        key: "total_work",
        label: "Total work",
        units: "kJ",
        render: d => toFixed(d, 0),
    },{
        key: "average_power",
        label: "Average power",
        units: "W",
        render: d => toFixed(d, 0),
    },{
        key: "normalized_power",
        label: "Normalized power",
        units: "W",
        render: d => toFixed(d, 0),
    },{
        key: "power_per_kg",
        label: "Relative power",
        units: "W/kg",
        render: d => toFixed(d, 2),
    },{
        key: "intensity_factor",
        label: "IF",
        units: "",
        render: d => toFixed(d, 2),
    },{
        key: "training_stress_score",
        label: "TSS",
        units: "",
        render: d => toFixed(d, 1),
    }
];


const linePlotDefinitions = [
    {
        key: 'altitude',
        color: undefined,
        fillColor: "#ccc",
        label: 'Elevation',
        units: 'feet',
        range: 'auto',
        hideMean: true,
        brushable: true,
        tickFormat: d => toFixed(d, 0),
    },{
        key: 'heart_rate',
        color: '#d62728', // red
        label: 'Heart rate',
        units: 'bpm',
        range: [90, 180],
        tickFormat: d => toFixed(d, 0),
    },{
        key: 'power',
        color: '#9467bd', // purple
        label: 'Power',
        units: 'watts',
        range: [0, 400],
        tickFormat: d => toFixed(d, 0),
    },{
        key: 'vam',
        color: '#ec77fd', // strava pink
        label: 'VAM',
        units: 'm/h',
        range: [0, 2000],
        tickFormat: d => toFixed(d, 0),
    },{
        key: 'speed',
        color: '#41b1e5', // strava teal
        label: 'Speed',
        units: 'mph',
        range: [0, 40],
        tickFormat: d => toFixed(d, 1),
    },{
        key: 'cadence',
        color: '#ee7f0e', // orange
        label: 'Cadence',
        units: 'rpm',
        range: [0, 120],
        tickFormat: d => toFixed(d, 0),
    },
];


export default {
    api, 
    tableColumnDefinitions,
    statsDefinitions,
    linePlotDefinitions, 
};