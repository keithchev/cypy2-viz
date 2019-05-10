

const linePlotDefinitions = [
    {
        key: 'altitude',
        color: '#333',
        label: 'Elevation',
        units: 'feet',
        range: 'auto',
        tickFormat: d => d.toFixed(0),
    },{
        key: 'speed',
        color: '#2ca02c',
        label: 'Speed',
        units: 'mph',
        range: [0, 40],
        tickFormat: d => d.toFixed(1),
    },{
        key: 'heart_rate',
        color: '#d62728',
        label: 'Heart rate',
        units: 'bpm',
        range: [90, 180],
        tickFormat: d => d.toFixed(0),
    },{
        key: 'power',
        color: '#9467bd',
        label: 'Power',
        units: 'watts',
        range: [0, 400],
        tickFormat: d => d.toFixed(0),
    },{
        key: 'cadence',
        color: '#ee7f0e',
        label: 'Cadence',
        units: 'rpm',
        range: [0, 120],
        tickFormat: d => d.toFixed(0),
    },{
        key: 'vam',
        color: '#666',
        label: 'VAM',
        units: 'm/h',
        range: [0, 3000],
        tickFormat: d => d.toFixed(0),
    },
];


export default {linePlotDefinitions};