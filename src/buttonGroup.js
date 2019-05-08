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

            this.value = [];
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
                this.value = [value];
            } else {
                if (this.value.includes(value)) {
                    this.value = this.value.filter(d => d!==value);
                } else {
                    this.value.push(value);
                }
            }
            d3.selectAll(`.${this.className}`)
                .classed("button-group-button-active", d => this.value.includes(d.value));
            this.callback(this.value);
        }

        setValue (val) {
            if (!Array.isArray(val)) val = [val];
            val.forEach(d => this.onClick(d));
        }
    }


export default ButtonGroup;
