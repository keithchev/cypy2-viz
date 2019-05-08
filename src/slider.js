import * as d3 from 'd3';

class Slider {

        constructor (container, label, range, callback) {

            if (!callback) callback = val => null;
            const sliderMin = 0, sliderMax = 100;

            // wrapper div within container
            container = d3.select(container)
                          .append("div")
                          .attr("class", "slider-container")
                          .node();

            d3.select(container)
              .append("div")
              .attr("class", "slider-label")
              .text(label);

            this.sliderValToVal = sliderVal => {
                return range[0] + (range[1] - range[0]) * sliderVal/sliderMax;
            }
            this.valToSliderVal = val =>  {
                return Math.round(sliderMax*(val - range[0]) / (range[1] - range[0]));
            }

            this.slider = d3.select(container)
                            .append("input")
                            .attr('type', "range") 
                            .attr('min', sliderMin) 
                            .attr('max', sliderMax)
                            .attr('class', "parameter-slider");

            this.textbox = d3.select(container)
                             .append("input")
                             .attr('type', "text")
                             .attr('class', "parameter-textbox");

            var _this = this;
            this.slider.on("input", function () {
                _this.textbox.property("value", _this.sliderValToVal(_this.slider.node().value));
                callback(_this.value()); 
            });

            this.textbox.on("input", function () {
                _this.slider.property("value", _this.valToSliderVal(_this.textbox.node().value));
                callback(_this.value());
            });
        }

        value (val) {
            if (!arguments.length) return +this.textbox.node().value;
            this.slider.property("value", `${this.valToSliderVal(val)}`);
            this.textbox.property("value", `${val}`);
        }
    }

    export default Slider;
