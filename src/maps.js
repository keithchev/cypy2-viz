import L from 'leaflet';
import * as d3 from 'd3';

import settings from './settings';


const selectedTrajectoryStyle = {
    color: 'red',
    weight: 3,
    opacity: .9,
};

const highlightedTrajectoryStyle = {
    color: '#0f81e2',
    weight: 4,
    opacity: 1,
}

const trajectoryCollectionStyle = {
    color: '#666', 
    opacity: .7
};

const markerStyle = {
    fillColor: "#1a80df",
    fillOpacity: 1,
    color: "#fff",
    stroke: true,
    weight: 2,
    radius: 6,
};


class TrajectoryMap {
/*     
    Leaflet map to display activity trajectories

    Arguments
    ---------
    container: string; ID of the div that wraps the lineplot
    onMapClick: callback called when the map is clicked
    onTrajectoryClick: callback called when a trajectory is clicked

    Methods
    -------
    updateTrajectory: function of activityId; updates the trajectory, displayed in red,
                      to the trajectory of the selected activity

    updateTrajectoryCollection: function of an array of activityIds; updates the trajectories,
                                displayed in gray, corresponding to the specified activities

    updateHighlightedSegment: function of a time interval [tmin, tmax] that highlights the portion
                              of the currently selected trajectory (shown in red) that occured
                              within the time interval

 */
    constructor({container, onMapClick, onTrajectoryClick}) {

        this.map = L.map(container);

        this.onMapClick = onMapClick;
        this.onTrajectoryClick = onTrajectoryClick;

        // OSM tiles
        L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);

        // polylines to display the selected activity's trajectory
        this.trajectory = L.polyline([[0, 0], [0, 0]], selectedTrajectoryStyle).addTo(this.map);
        this.highlightedTrajectory = L.polyline([[0, 0], [0, 0]], highlightedTrajectoryStyle).addTo(this.map);
        
        // layer to show all of the activities displayed in the table
        this.trajectories = L.geoJSON().addTo(this.map);

        // mouse marker (updated when the user hovers over the lineplots)
        // and click marker (updated when the user clicks on the map)
        this.mouseMarker = L.circleMarker([0, 0], markerStyle).addTo(this.map);
        this.clickMarker = L.circleMarker([0, 0], markerStyle).addTo(this.map);

        // one way to hide the clickMarker:
        // clickMarker.setStyle({opacity: 0, fillOpacity: 0});

        this.map.attributionControl.setPrefix(''); 
        this.map.setView([37.86, -122.22], 12);

        this.map.on("click", d => {
            this.clickMarker.setLatLng(d.latlng);
            this.onMapClick(d.latlng.lat, d.latlng.lng);
        });
    
        this.map.on("mousemove", function (d) {
            d3.select("#lat-lon-container")
              .html(`${d.latlng.lat.toFixed(6)}, ${d.latlng.lng.toFixed(6)}`);
        });

    }


    updateTrajectory (activityId, tolerance) {

        const url = settings.api.url({
            endpoint: `/trajectory/${activityId}`,
            tolerance: tolerance,
        });

        d3.json(url).then(data => {
            this.trajectoryCoordinates = data.coordinates;
            this.trajectory.setLatLngs(data.coordinates.map(row => [row[1], row[0]]));
            this.map.fitBounds(this.trajectory.getBounds());
        });

        this.trajectories.setStyle(feature => {
            if (feature.properties.activity_id===activityId) return {opacity: 0};
            return {opacity: .7};
        })
    }


    updateTrajectoryCollection (activityIds) {

        if (!activityIds.length) return;

        const url = settings.api.url({
            endpoint: '/trajectories',
            activity_ids: activityIds.join(','),
            tolerance: .0001,
        });

        const onEachFeature = (feature, layer) => {
            layer.on("mouseover", event => layer.setStyle({color: 'black'}));
            layer.on("mouseout", event => layer.setStyle(trajectoryCollectionStyle));
            layer.on("click", event => {
                L.DomEvent.stop(event);
                this.onTrajectoryClick(feature.properties.activity_id);
                return false;     
            });
        }

        // hard-coded tolerance to limit the payload size
        d3.json(url).then(data => {
              this.trajectories.remove()
              this.trajectories = L.geoJSON(data, {
                  style: d => trajectoryCollectionStyle,
                  onEachFeature: onEachFeature,
              }).addTo(this.map).bringToBack();
              this.map.fitBounds(this.trajectories.getBounds());
          })

    }


    // mark the trajectory when mousing over the lineplots
    updateMouseoverMarker (lat, lon) {

    }

    // highlight the segment of the selected trajectory between two timepoints
    updateHighlightedSegment (range) {
        if (range===null) {
            this.highlightedTrajectory.setLatLngs([[0, 0]]);
            return
        }
        const coords = this.trajectoryCoordinates.filter(row => {
            return (row[2] > range[0]) && (row[2] < range[1]);
        });
        this.highlightedTrajectory.setLatLngs(coords.map(row => [row[1], row[0]]));
    }


}


export default TrajectoryMap;