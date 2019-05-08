
import 'tachyons';
import L from 'leaflet';
import * as d3 from 'd3';

import './index.css';
import 'leaflet/dist/leaflet.css';

import Slider from './slider';
import MakeTable from './table';
import ButtonGroup from './buttonGroup';


// global state object (d3 included for debugging)
let APP = {d3};

//APP.toleranceSlider = new Slider('#tolerance-slider-container', 'Tolerance', [.0005, 0]);
//APP.toleranceSlider.value(.0001);

APP.toleranceButtons = new ButtonGroup({
    container: '#map-controls-container',
    className: 'tolerance-button',
    label: 'Tolerance',
    data: [0, .0001, .001],
    onlyOneHot: true,
    callback: val => {
      APP.tolerance = val;
      updateMap();
    }
});


APP.table = MakeTable(d3.select("#table-container"));
APP.table.onRowClick((row) => {
  APP.selectedActivityId = row.activity_id;
  updateMap();
});

APP.activityTypeButtons = new ButtonGroup({
    container: '#table-controls-container',
    className: 'activity-type-button',
    label: 'Type',
    data: ['run', 'ride', 'walk', 'hike'],
    onlyOneHot: false,
    callback: value => {
        APP.table.updateFilter('type', row => value.includes(row.activity_type));
        APP.table.update();
    }
  });

  APP.activityDateButtons = new ButtonGroup({
    container: '#table-controls-container',
    className: 'activity-year-button',
    label: 'Year',
    data: [2015, 2016, 2017, 2018, 2019],
    onlyOneHot: false,
    callback: value => {
        APP.table.updateFilter('year', row => value.includes(row.date.getFullYear()));
        APP.table.update();
    }
  });


d3.json('http://localhost:5000/metadata/201', d => d)
  .then(activities => {

    APP.activities = activities;
    APP.activities.forEach(parseActivityMetadata);
    APP.table.data(APP.activities);

    // set initial values
    APP.activityTypeButtons.setValue(['ride', 'run']);
    APP.activityDateButtons.setValue([2019]);
    APP.toleranceButtons.setValue(0);

  });


APP.map = L.map('map-container');
APP.jsonLayer = L.geoJSON().addTo(APP.map);

APP.map.on('mousemove', function (d) {
  d3.select("#lat-lon-container")
    .html(`${d.latlng.lat.toFixed(6)}, ${d.latlng.lng.toFixed(6)}`);
});


L.tileLayer(
  'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(APP.map);

APP.map.attributionControl.setPrefix(''); 
APP.map.setView([37.86, -122.22], 12);


function updateMap () {
  // row is a metadata object returned by api/metadata/

  const tolerance = APP.toleranceButtons.value;
  d3.json(`http://localhost:5000/trajectory/${APP.selectedActivityId}?tolerance=${tolerance}`, d => d)
    .then(function(data) {
      APP.jsonLayer.remove();
      APP.jsonLayer = L.geoJSON().addData(data).addTo(APP.map);
      APP.map.fitBounds(APP.jsonLayer.getBounds());
    });
}


function parseActivityMetadata (metadata) {

  // all of the timestamps should be (nearly) the same
  metadata.date = d3.isoParse(metadata.strava_timestamp);

  metadata.total_ascent *= 3.2808; // meters to feet
  metadata.total_distance *= 0.000621371; // meters to miles

}