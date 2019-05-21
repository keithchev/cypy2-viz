
import * as d3 from 'd3';
import settings from './settings';


const layout = [
    ["moving_time", "total_time"],
    ["total_distance", "average_speed"],
    ["elevation_gain", "elevation_loss"],
    ["average_vam", "average_grade"],
    ["total_work", "average_power"],
    ["normalized_power", "power_per_kg"],
    ["intensity_factor", "training_stress_score"],
];


class StatsTable {

    constructor ({container}) {

        this.stats = {};

        // definitions as a dict
        this.statsDefinitions = {};
        settings.statsDefinitions.forEach(def => {
            this.statsDefinitions[def.key] = def;
        });

        this._xDomain = null;

        container = d3.select(container);
        container.select("table").remove();

        this.table = container.append("table").attr("id", "stats-table");

        this.tr = this.table.selectAll("tr").data(layout)
                      .enter().append("tr")
                      .attr("class", "stats-table-tr");

        this.td = this.tr.selectAll("td").data(row => row)
                         .enter().append("td").attr("class", "stats-table-td");

        this.td.append("span")
               .attr("class", "stats-table-value")
               .text(d => this.stats[d]);
        
        this.td.append("span")
               .attr("class", "stats-table-units")
               .text(d => this.statsDefinitions[d].units);
        
        this.td.append("br");
        this.td.append("span")
               .attr("class", "stats-table-label")
               .text(d => this.statsDefinitions[d].label);
        
    }


    data (metadata, records) {

        this.metadata = metadata;

        // switch records from dict-of-arrays to array-of-dicts
        const keys = Object.keys(records);
        let row = {}, rows = [];
        for (let ind = 0; ind < records.elapsed_time.length; ind++) {
            row = {};
            keys.forEach(key => row[key] = records[key][ind]);
            rows.push(row);
        }

        this.records = rows;
        return this;

    }


    xDomain (xDomain) {
        // for now, assume the domain is in units of elapsed_time
        if (!arguments.length) return this._xDomain;
        this._xDomain = xDomain;
        return this;
    }


    update () {

        this.calcStats();
        this.td.selectAll(".stats-table-value")
            .text(d => this.statsDefinitions[d].render(this.stats[d]));

        return this;
    }


    calcStats () {
        // stats for a window
        // TODO: calculate average grade, normalized power, IF, and TSS
        
        const stats = {}

        let filter = row => true;
        if (this._xDomain) {
            filter = row => {
                return (row.elapsed_time > this._xDomain[0]) && (row.elapsed_time < this._xDomain[1]);
            }
        }

        const records = this.records.filter(filter);

        const first = records[0];
        const last = records[records.length-1];
        const dt = records[1].elapsed_time - records[0].elapsed_time;

        let dz, gain = 0, loss = 0;
        records.forEach((_, ind) => {
            if (ind) {
                dz = records[ind].altitude - records[ind-1].altitude;
                if (dz > 0) gain += dz;
                if (dz < 0) loss += -dz;
            }
        });

        stats.elevation_gain = gain;
        stats.elevation_loss = loss;

        stats.total_time = last.elapsed_time - first.elapsed_time;
        stats.total_distance = last.distance - first.distance;

        stats.moving_time = stats.total_time - d3.sum(records, d => d.pause_mask)*dt;

        stats.total_work = d3.sum(records, d => d.power) * dt/1000;
        stats.average_vam = d3.mean(records, d => d.vam);
        stats.average_speed = d3.mean(records, d => d.speed);
        stats.average_power = d3.mean(records, d => power);
        stats.average_cadence = d3.mean(records, d => d.cadence);
        
        this.stats = stats;

    }
}

export default StatsTable;


