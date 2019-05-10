

function toFixed(val, n) {
    if ((typeof val)!=='number') return 'NaN';
    return val.toFixed(n);
}


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


export default {linePlotDefinitions};