import React, {Component} from 'react';
import * as d3 from 'd3';

class PC extends Component {

    constructor(props) {
        super(props);
        this.data = this.props.data;
        this.data = this.props.data;
        this.title = "Parallel coordinates";
        const margin = {top: 40, right: 20, bottom: 20, left: -30};
        this.size = {
            margin: margin,
            width: window.screen.width / 1.5 - margin.left - margin.right,
            height: window.screen.height / 1.8 - margin.top - margin.bottom
        };
        this.drawPCPlot = this.drawPCPlot.bind(this);
    }

    componentDidMount() {
        this.drawPCPlot(this.data, this.size, this.props.attributes, this.props.interaction);
    }

    componentDidUpdate() {
        d3.selectAll("g > *").remove();
        this.drawPCPlot(this.data, this.size, this.props.attributes, this.props.interaction);
    }

    /**
     * drawPCPlot draws the PC Plot.
     * This code is (partially) based on example code by Jason Davies, which can be found here: https://bl.ocks.org/jasondavies/1341281
     *
     * @param data is the chosen dataset.
     * @param size is the size of the plot.
     * @param attributes are the chosen attributes by the user.
     * @param interaction is the selected interaction in the input panel.
     */
    drawPCPlot(data, size, attributes, interaction) {

        var color = d3.scaleOrdinal(attributes.colorScheme);

        // The categories of the categorical attribute are the keys, such that they can be used for legend and filtering
        var colorAttribute = attributes.color;
        var unique = colorAttribute !== "" ? [...new Set(data.map(item => item[colorAttribute]))] : [];
        var keys = unique
            .sort(function(a, b) {
                return a - b;
            })
            .filter(key => {
                return key !== undefined && key !== null
            });

        // Append the svg object to the body of the page
        var svg = d3
            .select("#canvas")
            .attr("width", size.width + size.margin.left + size.margin.right)
            .attr("height", Math.max(size.height + size.margin.top + size.margin.bottom, 20 + keys.length * 30))
            .append("g")
            .attr("transform", "translate(" + size.margin.left + "," + size.margin.top + ")");

        // Extract the list of dimensions to keep in the plot.
        var dimensions = [];
        attributes.pc.forEach(element =>
            dimensions.push(element.attr)
        );

        // Store the line data
        var line = d3.line(),
            background,
            foreground,
            extents;

        var axis = d3.axisLeft();

        var dragging = {};

        // Create svg for the legend
        var legend = svg.append('svg');
        // Set the horizontal position of the legend
        var xPosition = (dimensions.length * (size.width / 5) - 100);
        // For each category in the legend draw a coloured circle and add the category name.
        for (var i = 0; i < (keys.length); i++) {
            legend
                .append("circle")
                .attr("cx",xPosition)
                .attr("cy", 100 + i*30)
                .attr("r", 6)
                .style("fill", color(keys[i]))
            legend
                .append("text")
                .attr("x", xPosition + 20)
                .attr("y", 100 + i*30)
                .text(keys[i])
                .style("font-size", "15px")
                .attr("alignment-baseline","middle")
        }

        // For each dimension build a linear scale.
        var y = {};
        for (let i in dimensions) {
            const name = dimensions[i]
            y[name] = d3.scaleLinear()
                .domain([attributes.pc[i].slider.min, attributes.pc[i].slider.max])
                .range([size.height, 0])
        }      

        // Build the X scale -> it find the best position for each Y axis
        let x = d3.scalePoint()
            .range([-dimensions.length * 24, dimensions.length * (size.width / 5)])
            .padding(1)
            .domain(dimensions); 

        // Set the default extents of all brushes. ([0,0] => no brush active)
        extents = dimensions.map(function(p) {
            return [0,0];
        });

        //Add grey background lines for context.
        background = svg
            .append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter()
            .filter(function(d) {
                if ((attributes.category != null)) {
                    // If a category is selected, show only the the values of that one value
                    return attributes.pc.every(attribute => (
                        d[attribute.attr] !== null &&
                        d[attribute.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined)) &&
                        d[attributes.color] == attributes.category
                    ));
                } else {
                    // Show all categories and all with different colors
                    return attributes.pc.every(attribute => (
                        d[attribute.attr] !== null &&
                        d[attribute.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined))
                    ));
                }
            })
            .append("path")
            .filter(function(d) {
                var withinBounds = true;
                for (let i in dimensions) {
                    const name = dimensions[i];
                    if (d[name] <= attributes.pc[i].slider.min || d[name] >= attributes.pc[i].slider.max) {
                        withinBounds = false;
                    }
                }
                return withinBounds;
            })
            .attr("d", path);

        // Add foreground lines for focus.
        foreground = svg
            .append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter()
            .filter(function(d) {
                if ((attributes.category != null)) {
                    // If a category is selected, show only the the values of that one value
                    return attributes.pc.every(attribute => (
                        d[attribute.attr] !== null &&
                        d[attribute.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined)) &&
                        d[attributes.color] == attributes.category
                    ))
                } else {
                    // Show all categories and all with different colors
                    return attributes.pc.every(attribute => (
                        d[attribute.attr] !== null &&
                        d[attribute.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined))
                    ))
                }
            })
            .append("path")
            .filter(function(d) {
                var withinBounds = true;
                for (let i in dimensions) {
                    const name = dimensions[i];
                    if (d[name] <= attributes.pc[i].slider.min || d[name] >= attributes.pc[i].slider.max) {
                        withinBounds = false;
                    }
                }
                return withinBounds;
            })
            .attr("d", path)
            .style("stroke", function (d) {
                if (attributes.category !== null) {
                    let i;
                    for (i = 0; i < keys.length; i++) {
                        // Check which category has been chosen and keep the color
                        if (attributes.category == keys[i]) {
                            return color(keys[i]);
                        }
                    }
                }
                return ((attributes.color) ? color(d[attributes.color]) : "#377eb8")
            })
            .style("stroke-width", "0.8")
            .attr("opacity", 0.6)
            .on('mouseover', interaction === "hover" ? handleMouseOver : null)
            .on('mouseout', interaction === "hover" ? handleMouseOut : null);

        // Add a group element for each dimension.
        var g = svg
            .selectAll(".dimension")
            .data(dimensions)
            .enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) {
                return "translate(" + x(d) + ")";
            })
            // create a drag function
            .call(d3.drag()
                .subject(function(d) {
                    return {x: x(d)};
                })
                // While dragging continuously update the paths of the plot.
                .on("drag", function(event, d) {
                    dragging[d] = Math.min(size.width, Math.max(0, event.x));
                    foreground.attr("d", path);
                    background.attr("d", path);
                    dimensions.sort(function(a, b) {
                        return position(a) - position(b);
                    });
                    x.domain(dimensions);
                    g.attr("transform", function(d) {
                        return "translate(" + position(d) + ")";
                    })
                })
                // Set the paths at the end of the dragging.
                .on("end", function(d) {
                    delete dragging[d];
                    foreground
                            .attr("d", path)
                            .transition()
                    background
                        .attr("d", path)
                        .transition()
                })
            );

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis_PC")
            .each(function(d) {
                d3.select(this).call(axis.scale(y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .style("font-size", "13px")
            .style("font-weight", "bold")
            .attr("y", -9)
            .text(function(d) { return d; })
            .style("fill", "black");

        // // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function(d) {
                if (interaction === "brush") {
                    d3.select(this)
                        .call(y[d].brush = d3.brushY()
                            .extent([[-8, 0], [8,size.height]])
                            .on("start", brushstart)
                            .on("brush", brush_parallel_chart)
                            .on("end", brushend)
                        );
                }
            })
            .selectAll("rect")
            .attr("x", -50)
            .attr("width", 100);


        /**
         * position gives the position of the axis of d.
         *
         * @param d     inputted data point
         * @returns {*} the dragged position of the axis of d if the axis of d has been dragged.
         */
        function position(d) {
            var v = dragging[d];
            return v == null ? x(d) : v;
        }

        /**
         * path gives the path for a given data point.
         *
         * @param d     inputted data point
         * @returns {*} the path for a given data point.
         */
        function path(d) {
            return line(dimensions.map(function(p) {
                return [position(p), y[p](d[p])];
            }));
        }

        /**
         * Starts a brush event.
         *
         * @param event     brush event
         * @param d         inputted data point
         */
        function brushstart(event, d) {
            event.sourceEvent.stopPropagation();
        }
            
        /**
         * Handles a brush event while the brush is being altered, toggling the display of foreground lines.
         *
         * @param event     brush event
         */
        function brush_parallel_chart(event) {    
            // Calculate for each axis the extents of its brush (the min and max value of the brush).
            for (var i=0; i<dimensions.length; ++i){
                if (event.target === y[dimensions[i]].brush) {
                    extents[i] = event.selection.map(y[dimensions[i]].invert, y[dimensions[i]]);
                    //console.log(y[dimensions[i]].invert);
                    //console.log(y[dimensions[i]])
                }
            }

            // If path is outside of the extent of the brush, set its style to "none" (do not render it).
            foreground.style("display", function(d) {
                return (dimensions.every(function(p, i) {
                    if(extents[i][0]===0 && extents[i][0]===0) {
                        return true;
                    }
                return extents[i][1] <= d[p] && d[p] <= extents[i][0];
                }) ? null : "none");
            });
        }

        /**
         * Handles the end of a brush event, toggling the display of foreground lines.
         *
         * @param event     brush event
         */
        function brushend(event) {
            // Calculate for each axis the extents of its brush (the min and max value of the brush).
            for (var i=0; i<dimensions.length; ++i){
                if (event.target === y[dimensions[i]].brush) {
                    // If brush is deselected, reset the extents of its axis
                    if (event.selection == null) {
                        extents[i] = [0,0]
                    } else {
                        extents[i] = event.selection.map(y[dimensions[i]].invert, y[dimensions[i]]);
                    }
                }
            }

            // If path is outside of the extent of the brush, set its style to "none" (do not render it)
            foreground.style("display", function(d) {
                return (dimensions.every(function(p, i) {
                    if(extents[i][0]===0 && extents[i][0]===0) {
                        return true;
                    }
                return extents[i][1] <= d[p] && d[p] <= extents[i][0];
                }) ? null : "none");
            });
        }

        /**
         * When a mouse hovers over a data point, set the corresponding values in the output pannel.
         * Also highlight the hovered data point and unhighlight the other data points.
         *
         * @param event     hovering event
         * @param data      inputted data point
         */
        function handleMouseOver(event, data) {
            // Remove existing text in output pannel
            d3.select("#output")
                .selectAll("*")
                .remove();

            // Add patient id to output pannel
            d3.select("#output")
                .append("div")
                .attr("class", "output")
                .html("ID: " + data["Patient ID"]);

            // Add axis values to output pannel
            dimensions.forEach(dimension => {
                d3.select("#output")
                    .append("div")
                    .attr("class", "output")
                    .html(dimension + ": " + data[dimension])});

            if (attributes.color) {
                d3.select("#output")
                    .append("div")
                    .attr("class", "output")
                    .html(attributes.color + ": " + data[attributes.color])
            }

            // Disable background lines
            background.style("display", "none");

            // Increase the stroke-width of the hovered line
            foreground.style("stroke-width", function(d) {
                if (d === data) {
                    return "2.5"
                } else {
                    return ".8"
                }
            });

            // Decrease the opacity of non-hovered lines
            foreground.attr("opacity", function(d) {
                if (d === data) {
                    return ".75"
                } else {
                    return ".1"
                }
            });
        }

        /**
         * Handles what happens when the mouse is not hovering over a line anymore.
         *
         * @param event     hovering event
         * @param data      inputted data point
         */
        function handleMouseOut(event, data) {
            d3.select("#output").selectAll("*").remove();

            // Reset background display style
            background.style("display", null);
            // Reset foreground display style.
            foreground
                .style("stroke-width", "0.8")
                .attr("opacity", "0.6");
        }
    }

    render() {
        return (
            <div>
                <svg id='canvas'/>
            </div>
        )
    }
}

export default PC;
