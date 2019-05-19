import L from 'leaflet';
import * as d3 from 'd3';

import settings from './settings';


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


class Map {

    constructor({container, onClick}) {

        this.map = L.map(container);

        // OSM tiles
        L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);

        // JSON layer and marker
        this.trajectory = L.polyline([[0, 0], [0, 0]], lineOptions).addTo(this.map);

        this.trajectories = L.geoJSON().addTo(this.map);

        this.mouseMarker = L.circleMarker([0, 0], markerOptions).addTo(this.map);
        this.clickMarker = L.circleMarker([0, 0], markerOptions).addTo(this.map);

        // one way to hide the clickMarker:
        // clickMarker.setStyle({opacity: 0, fillOpacity: 0});

        this.map.attributionControl.setPrefix(''); 
        this.map.setView([37.86, -122.22], 12);

        this.map.on("click", d => {
            this.clickMarker.setLatLng(d.latlng);
            onClick(d.latlng.lat, d.latlng.lng);
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

        // hard-coded tolerance to limit the payload size
        d3.json(url).then(data => {
              this.trajectories.remove()
              this.trajectories = L.geoJSON(data).addTo(this.map);
              this.trajectories.setStyle(d => ({color: '#666', opacity: .7}))
              this.map.fitBounds(this.trajectories.getBounds());
              this.trajectory.bringToFront();
          })

    }


    // mark the trajectory when mousing over the lineplots
    updateMouseoverMarker (lat, lon) {

    }



}


export default Map;