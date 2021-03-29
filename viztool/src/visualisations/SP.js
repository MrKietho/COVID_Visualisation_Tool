import React, {Component} from 'react';
import * as d3 from 'd3';

// This code is (partially) based on example code by Yan Holtz, which can be found here: https://www.d3-graph-gallery.com/graph/scatter_basic.html

class SP extends Component {

    constructor(props) {
        super(props);

        this.data = this.props.data;
        this.title = "Scatterplot";

        const margin = {top: 30, right: 30, bottom: 50, left: 60};
        this.size = {
            margin: margin,
            width: window.innerHeight / 1.3 - margin.left - margin.right, 
            height: window.innerHeight / 1.3 - margin.top - margin.bottom
        };

        this.drawScatterplot = this.drawScatterplot.bind(this);
    }

    componentDidMount() {
        this.drawScatterplot(this.data, this.size, this.props.attributes, this.title, this.props.interaction);
    }

    componentDidUpdate() {
        d3.selectAll("g").remove();
        this.drawScatterplot(this.data, this.size, this.props.attributes, this.title, this.props.interaction);
    }

    /**
     * Draws the scatterplot.
     *
     * @param data input dataset
     * @param size size of scatterplot
     * @param attributes attributes to be visualized in scatterplot
     * @param title not used
     * @param interaction chosen interaction
     */
    drawScatterplot(data, size, attributes, title, interaction) {

        var colorAttribute = attributes.color;

        // Define colormapping of the dots and save the unique values in keys such that each key is a category.
        var unique = colorAttribute !== "" ? [...new Set(data.map(item => item[colorAttribute]))] : [];
        var keys = unique.sort(function(a,b) {
            return a - b;
        })
            .filter(key => {
                return key !== undefined && key !== null
            });

        // create SVG where the scatterplot is shown
        let svg = d3.select("#canvas")
            .attr("width", size.width + size.margin.left + size.margin.right + 200)
            .attr("height", Math.max(size.height + size.margin.top + size.margin.bottom, 20 + keys.length * 30))
            .append("g")
            .attr("transform", "translate(" + size.margin.left + "," + size.margin.top + ")");

        const x_min = attributes.x.slider.min;
        const x_max = attributes.x.slider.max;
        const y_min = attributes.y.slider.min;
        const y_max = attributes.y.slider.max;

        // Add X axis
        var x = d3.scaleLinear()
            .domain([ x_min, x_max ])
            .range([ 0, size.width ]);

        // Add X axis of SVG
        var xAxis = svg.append("g")
            .attr("transform", "translate(0," + size.height + ")")
            .call(d3.axisBottom(x));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([ y_min, y_max ])
            .range([ size.height, 0]);

        // Add y axis of SVG
        var yAxis = svg.append("g")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(y));

        var color = d3.scaleOrdinal(attributes.colorScheme);

        var selected = [];

        // Add a clipPath: everything out of this area won't be drawn.
        svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", size.width)
            .attr("height", size.height)
            .attr("x", 0)
            .attr("y", 0);

        // Add the brush feature using the d3.brush function
        var brush = d3.brush()
            // initialise the brush area: start at 0,0 and finishes at width,height
            // It means I select the whole graph area
            .extent( [ [0,0], [size.width, size.height] ] )
            .on("brush", interaction === "brush" ? brushmove : null)
            // Each time the brush selection changes, trigger the 'updateChart' function
            .on("end", (interaction === "brush") ? brushend : (interaction === "box zoom") ? updateChart : null)

        // Create svg for the legend
        var legend = svg.append('svg')
        // Set the horizontal position of the legend
        var xPosition = size.width + size.margin.left + size.margin.right;
        // For each category in the legend draw a coloured circle and add the category name.
        var i;
        for (i = 0; i < keys.length; i++) {
            legend.append("circle")
                .attr("cx", xPosition)
                .attr("cy", 40 + i * 30)
                .attr("r", 6)
                .style("fill", color(keys[i]));
            legend.append("text")
                .attr("x", xPosition + 20)
                .attr("y", 40 + i * 30)
                .text(keys[i])
                .style("font-size", "15px")
                .attr("alignment-baseline", "middle");
        }

        // Append g element to add dots to the SVG
        var scatter = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Add dots to SVG
        scatter.selectAll("dot")
            .data(data)
            .enter()
            .filter(function(d) {
                if ((attributes.category != null)) {
                    return (
                        // If a category is selected, show only the the values of that one value.
                        (d[attributes.x.attr] !== null && d[attributes.y.attr] !== null) &&
                        d[attributes.x.attr] !== undefined && d[attributes.y.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined)) &&
                        (d[attributes.color] == attributes.category)
                    )
                } else {
                    return (
                        // Show all categories and all with different colors.
                        (d[attributes.x.attr] !== null && d[attributes.y.attr] !== null) &&
                        d[attributes.x.attr] !== undefined && d[attributes.y.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined))
                    )
                }
            })
            .append("circle")
                .attr("cx", function (d) {
                    return x(d[attributes.x.attr]);
                })
                .attr("cy", function (d) {
                    return y(d[attributes.y.attr]);
                })
                .attr("r", 2.5)
                .style("fill", function (d) {
                    if (attributes.category !== null) {
                        let i;
                        for (i = 0; i < keys.length; i++) {
                            if (attributes.category == keys[i]) {
                                return color(keys[i]);
                            }
                        }
                    }
                    return ((attributes.color) ? color(d[attributes.color]) : "#377eb8");
                })
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOut)
            .on("click", function (d) {
                if (!selected.includes(this)) {
                    selected.push(this);
                } else {
                    d3.select(this)
                        .transition()
                        .duration(50)
                        .attr("r", 2.5);
                    selected.splice(selected.indexOf(this), 1);
                }
            });

        /**
         * Function to receive information about a dot when hoovering over it with cursor.
         *
         * @param event 
         * @param data is input data
         */
        function handleMouseOver(event, data) {
            // Update the output panel text
            d3.select("#output")
                .selectAll("*")
                .remove();

            d3.select("#output")
                .append("div")
                .attr("class", "output")
                .html("ID: " + data["Patient ID"]);

            d3.select("#output")
                .append("div")
                .attr("class", "output")
                .html("x: " + data[attributes.x.attr]);

            d3.select("#output")
                .append("div")
                .attr("class", "output")
                .html("y: " + data[attributes.y.attr]);

            if (attributes.color) {
                d3.select("#output")
                    .append("div")
                    .attr("class", "output")
                    .html(attributes.color + ": " + data[attributes.color]);
            }
            // reduce opacity of all dots, except legend dots
            d3.selectAll("circle").attr("opacity", 0.1);
            legend.selectAll("circle").attr("opacity", 1);

            // increase dot size on mouse entering and increase opacity only of selected dot
            d3.select(this).transition()
                .duration('30')
                .attr("r", 5.5)
                .attr("opacity", 1);
        }

        /**
         * Function to handle when cursor is not hoovering over dots.
         *
         * @param event
         * @param data
         */
        function handleMouseOut(event, data) {
            if (!selected.includes(this)) {
                d3.selectAll("circle").attr("opacity", 1);
                d3.select("#output").selectAll("*").remove()
                d3.select(this).transition().duration(50).attr("r", 2.5)
            }
        }

        // add title to X-axis
        svg.append("text")             
            .attr("transform", "translate(" + (size.width/2) + " ," + (size.height + size.margin.top + 10) + ")")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(attributes.x.attr);

        // Add title to Y-axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - size.margin.left)
            .attr("x", 0 - (size.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(attributes.y.attr);

        // Choose interaction
        if (interaction === "brush" || interaction === "box zoom") {
            scatter.append("g")
                    .attr("class", "brush")
                    .call(brush);
        }

        // A function that set idleTimeOut to null
        var idleTimeout;  
        function idled() {
            idleTimeout = null;
        }

        /**
         * A function that update the chart for given boundaries.
         *
         * @param event
         * @returns {number}
         */
        function updateChart(event) {
            const extent = event.selection;

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                // This allows to wait a little bit
                if (!idleTimeout) {
                     return idleTimeout = setTimeout(idled, 350) ;
                }

                x.domain([x_min, x_max]);
                y.domain([y_min, y_max]);
            } else {
                x.domain([ x.invert(extent[0][0]), x.invert(extent[1][0]) ]);
                y.domain([ y.invert(extent[1][1]), y.invert(extent[0][1]) ]);

                // This remove the grey brush area as soon as the selection has been done
                scatter.select(".brush").call(brush.move, null);
            }
        
            // Update axis and circle position
            xAxis.transition().duration(1000).call(d3.axisBottom(x));
            yAxis.transition().duration(1000).call(d3.axisLeft(y));
            scatter
                .selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) {
                    return x(d[attributes.x.attr]);
                })
                .attr("cy", function (d) {
                    return y(d[attributes.y.attr]);
                });
        }

        /**
         * Highlights the selected circles.
         * @param event
         * @param p
         */
        function brushmove(event, p) {
            var e = d3.brushSelection(this);

            // Select only the dots within the formed rectangle, increase their opacity and
            // lower the opacity of the other dots outside the rectangle
            svg.selectAll("circle").attr("opacity", function(d) {
                if (d !== undefined) {
                    if (e && (e[0][0] > x(d[attributes.x.attr]) ||
                        x(d[attributes.x.attr]) > e[1][0] ||
                        e[0][1] > y(d[attributes.y.attr]) ||
                        y(d[attributes.y.attr]) > e[1][1])) {
                        return 0.1;
                    } else  {
                        return 1;
                    } 
                }
            });
        }

        /**
         * If the brush is empty, select all circles.
         */
        function brushend() {
            var e = d3.brushSelection(this);
            if (e === null) svg.selectAll("circle").attr("opacity", 1);
        }
    }

    render() {
        return <svg id='canvas'/>
    }
}
    
export default SP;
