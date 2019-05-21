
import 'tachyons';
import L from 'leaflet';
import * as d3 from 'd3';

import './index.css';
import 'leaflet/dist/leaflet.css';

import Slider from './slider';
import makeTable from './table';
import statsTable from './statsTable';

import TrajectoryMap from './maps';
import makeLinePlot from './linePlot'
import ButtonGroup from './buttonGroup';

import utils from './utils';
import settings from './settings';
import StatsTable from './statsTable';

// global state object (d3 included for debugging)
let APP = {L, d3};


// ------------------------------------------------------------------
//
// Activity table and callbacks
//
// ------------------------------------------------------------------
APP.table = makeTable({
    container: "#table-container"
});

// 'row' here is an activity metadata object
APP.table.onRowClick(row => changeSelectedActivity(row));

// whenever the table changes (on filtering, paging, sorting, proximity searching, etc)
APP.table.onUpdate(displayedData => {
    APP.displayedActivityIds = displayedData.map(row => row.activity_id);
    APP.map.updateTrajectoryCollection(APP.displayedActivityIds);
});


// ------------------------------------------------------------------
//
// stats table and callbacks
//
// ------------------------------------------------------------------

APP.statsTable = new StatsTable({
    container: '#stats-table-container',
});


// ------------------------------------------------------------------
//
// Activity table filters
//
// ------------------------------------------------------------------
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


// ------------------------------------------------------------------
//
// Map 
//
// ------------------------------------------------------------------
APP.map = new TrajectoryMap({
    container: 'map-container',
    onClick: function (lat, lon) {
        d3.json(settings.api.url({endpoint: `/near/${lat}/${lon}`}))
          .then(data => {
            APP.table.merge(data, 'activity_id')
                     .sortParams({key: 'proximity', order: -1})
                     .update();
        });
    }
});

APP.toleranceButtons = new ButtonGroup({
    container: '#map-controls-container',
    className: 'tolerance-button',
    label: 'Tolerance',
    data: [0, .0001, .001],
    onlyOneHot: true,
    callback: values => {},
});

// ------------------------------------------------------------------
//
// map controls - proximity search
// TODO: get rid of this?
//
// ------------------------------------------------------------------
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
    }
    // reset the filter if we're deactivating the search
    if (!APP.proximitySearch) {
        APP.d3.select(APP.map._container).style("cursor", "");
        APP.table.updateFilter('proximity', d => true).update();
    }
  });


// ------------------------------------------------------------------
//
// Line plots
//
// ------------------------------------------------------------------
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

        // TODO: move this to APP.map.onMouseMove?
        const [lat, lon] = [APP.records.lat[mouseIndex], APP.records.lon[mouseIndex]];
        APP.map.mouseMarker.setLatLng([lat, lon]);

        APP.linePlots.each(linePlot => {
            linePlot.updateMousePosition(mouseIndex);
        });
    });

    // update the x-domain in the stats table and all line plots except the altitude plot
    // TODO: only define onBrushCallback for the altitude lineplot
    linePlot.onBrushCallback(xDomain => {
        APP.statsTable.xDomain(xDomain).update();
        APP.linePlots.each(linePlot => {
        if (linePlot.definition().key==='altitude') return;
            linePlot.xDomain(xDomain).update();
        });
    });
});


// ------------------------------------------------------------------
//
// App initialization
//
// ------------------------------------------------------------------
d3.json(settings.api.url({endpoint: '/metadata/20'}))
  .then(activities => {

      // set tolerance first so map loads correctly
      APP.toleranceButtons.setValue(.0001);

      APP.activities = activities;
      APP.activities.forEach(parseActivityMetadata);
      APP.table.data(APP.activities);

      APP.activityTypeButtons.setValue(['ride']);
      APP.activityDateButtons.setValue([2019]);

});


function changeSelectedActivity (metadata) {

    // update the global state
    APP.selectedActivityId = metadata.activity_id;

    // update the map
    APP.map.updateTrajectory(APP.selectedActivityId, APP.toleranceButtons.values);

    // load the activity records
    const url = settings.api.url({
        endpoint: `/records/${APP.selectedActivityId}`,
        sampling: 10
    });

    d3.json(url)
      .then(function (records) {
        APP.records = records;

        // update the stats table
        APP.statsTable.data(metadata, records).xDomain(null).update();

        // update the lineplots
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