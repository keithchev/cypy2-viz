
import 'tachyons';
import L from 'leaflet';
import * as d3 from 'd3';

import './index.css';
import 'leaflet/dist/leaflet.css';

import Slider from './slider';
import makeTable from './table';
import makeLinePlot from './linePlot'
import ButtonGroup from './buttonGroup';

import settings from './settings';
import utils from './utils';

// global state object (d3 included for debugging)
let APP = {L, d3};

//APP.toleranceSlider = new Slider('#tolerance-slider-container', 'Tolerance', [.0005, 0]);
//APP.toleranceSlider.value(.0001);

APP.toleranceButtons = new ButtonGroup({
    container: '#map-controls-container',
    className: 'tolerance-button',
    label: 'Tolerance',
    data: [0, .0001, .001],
    onlyOneHot: true,
    callback: values => updateMap(),
});


APP.table = makeTable(d3.select("#table-container"));
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
    callback: values => {
        APP.table
           .updateFilter('type', row => !values.length || values.includes(row.activity_type))
           .update();
    }
  });

  APP.activityDateButtons = new ButtonGroup({
    container: '#table-controls-container',
    className: 'activity-year-button',
    label: 'Year',
    data: [2015, 2016, 2017, 2018, 2019],
    onlyOneHot: false,
    callback: values => {
        APP.table
           .updateFilter('year', row => !values.length || values.includes(row.date.getFullYear()))
           .update();
    }
  });


d3.json('http://localhost:5000/metadata/201', d => d)
  .then(activities => {

    APP.activities = activities;
    APP.activities.forEach(parseActivityMetadata);
    APP.table.data(APP.activities);

    // set initial values
    APP.activityTypeButtons.setValue(['ride']);
    APP.activityDateButtons.setValue([2019]);
    APP.toleranceButtons.setValue(.0001);

  });


const lineOptions = {
  color: 'red',
  weight: 3,
  opacity: .9,
};

const markerOptions = {
  fillColor: "#1a80df",
  fillOpacity: 1,
  color: "#fff",
  stroke: true,
  weight: 1.5,
  radius: 5,
};

APP.map = L.map('map-container');

// OSM tiles
L.tileLayer(
  'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(APP.map);

// JSON layer and marker
APP.trajectory = L.polyline([[0,0],[1,1]], lineOptions).addTo(APP.map);
APP.mouseMarker = L.circleMarker([0, 0], markerOptions).addTo(APP.map);
APP.proximityMarker = L.circleMarker([0, 0], markerOptions).addTo(APP.map);

APP.map.attributionControl.setPrefix(''); 
APP.map.setView([37.86, -122.22], 12);

APP.map.on('mousemove', function (d) {
  d3.select("#lat-lon-container")
    .html(`${d.latlng.lat.toFixed(6)}, ${d.latlng.lng.toFixed(6)}`);
});

APP.map.on("click", function (d) {
  d3.json(`http://localhost:5000/near/${d.latlng.lat}/${d.latlng.lng}`, d => d)
    .then(data => {
      APP.table
         .merge(data, 'activity_id')
         .sortParams({key: 'proximity', order: -1})
         .update();
    });
  APP.proximityMarker.setLatLng(d.latlng);
});


d3.select("#map-controls-container")
  .append("div")
  .attr("class", "button-group-button")
  .attr("id", "proximity-search-button")
  .text("Proximity search")
  .on("click", function (d) {
    const isActive = d3.select(this).classed("button-group-button-active");
    d3.select(this).classed("button-group-button-active", !isActive);
    APP.proximitySearch = !isActive;

    // if we're activating the search
    if (APP.proximitySearch) {
      APP.d3.select(APP.map._container).style("cursor", "crosshair");
      APP.proximityMarker.setStyle({opacity: 1, fillOpacity: 1});
    }
    // reset the filter if we're deactivating the search
    if (!APP.proximitySearch) {
      APP.d3.select(APP.map._container).style("cursor", "");
      APP.table.updateFilter('proximity', d => true).update();
      APP.proximityMarker.setStyle({opacity: 0, fillOpacity: 0});
    }
  });


d3.select("#plot-container")
  .selectAll("div")
  .data(settings.linePlotDefinitions)
  .enter().append("div")
  .selectAll("div")
  .data(function (definition) { return [makeLinePlot(this, definition)] })
  .enter().append("div")
  .attr("class", "line-plot-container");

APP.linePlots = d3.selectAll(".line-plot-container");
APP.linePlots.each(linePlot => {

  // update the mouse marker on the map and the mouse line in all line plots
  linePlot.onMouseMoveCallback(mouseIndex => {
    const [lat, lon] = [APP.records.lat[mouseIndex], APP.records.lon[mouseIndex]];
    APP.mouseMarker.setLatLng([lat, lon]);
    APP.linePlots.each(linePlot => {
      linePlot.updateMousePosition(mouseIndex);
    });
  });

  // update the x-domain in all line plots except the altitude plot
  linePlot.onBrushCallback(xDomain => {
    APP.linePlots.each(linePlot => {
      if (linePlot.definition().key==='altitude') return;
      linePlot.xDomain(xDomain).update();
    });
  });

});


function updateMap () {

  const tolerance = APP.toleranceButtons.values;
  d3.json(`http://localhost:5000/trajectory/${APP.selectedActivityId}?tolerance=${tolerance}`, d => d)
    .then(function(data) {
      APP.trajectory.setLatLngs(data.coordinates.map(row => [row[1], row[0]]));
      APP.map.fitBounds(APP.trajectory.getBounds());
    });

  d3.json(`http://localhost:5000/records/${APP.selectedActivityId}?sampling=10`, d => d)
    .then(function (records) {
      APP.records = records;
      APP.linePlots.each(linePlot => {
        linePlot.lineData({
          x: records.elapsed_time, 
          y: records[linePlot.definition().key]
        });
        linePlot.xDomain(null).update();
      });
    });
}





function parseActivityMetadata (metadata) {

  // all of the timestamps should be (nearly) the same
  metadata.date = d3.isoParse(metadata.strava_timestamp);

  metadata.total_ascent *= 3.2808; // meters to feet
  metadata.total_distance *= 0.000621371; // meters to miles

}