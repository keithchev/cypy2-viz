import * as d3 from 'd3';

class ButtonGroup {

        constructor ({container, className, label, data, callback, onlyOneHot}) {

            // data is an array of button values or value-label pairs 
            // either as [value1, value2,...] or [[label1, value1], ...] or [{label, value}, ...]

            // construct the {label, value} pairs
            if (Array.isArray(data[0])) {
                data = data.map(row => ({label: row[0], value: row[1]}));

            // use the value itself as the label if the data is an array of primitives
            } else if (typeof data[0] !== 'object') {
                data = data.map(value => ({label: value, value}));
            }

            this.values = [];
            this.data = data;
            this.callback = callback;
            this.className = className;
            this.onlyOneHot = onlyOneHot;

            if (!callback) callback = val => null;

            // wrapper div within container
            container = d3.select(container)
                          .append("div")
                          .attr('class', 'button-group-container')
                          .attr("id", `${className}-container`);
            
            container.append("div")
                     .attr("class", "button-group-label")
                     .text(label);

            container.selectAll(`.${className}`)
              .data(data)
              .enter().append('div')
              .attr('class', `button-group-button ${className}`)
              .text(d => d.label)
              .on("click", d => this.onClick(d.value));

        }

        onClick (value) {

            if (this.onlyOneHot) {
                this.values = [value];
            } else {
                if (this.values.includes(value)) {
                    this.values = this.values.filter(d => d!==value);
                } else {
                    this.values.push(value);
                }
            }
            d3.selectAll(`.${this.className}`)
              .classed("button-group-button-active", d => this.values.includes(d.value));
            this.callback(this.values);
        }

        setValue (val) {
            // TODO: verify that val is one of the values specified in this.data
            if (!Array.isArray(val)) val = [val];
            val.forEach(d => this.onClick(d));
        }
    }


export default ButtonGroup;
