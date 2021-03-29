import React, {Component} from 'react';
import * as d3 from 'd3';
import "../styling/SPMatrix.css"

// This code is (partially) based on example code by Philippe Rivière, which can be found here: https://bl.ocks.org/Fil/6d9de24b31cb870fed2e6178a120b17d

class SPMatrix extends Component {

    constructor(props) {
        super(props);

        this.drawSPMatrixPlot = this.drawSPMatrixPlot.bind(this);
    }

    componentDidMount() {
        this.drawSPMatrixPlot(this.props.data, this.props.attributes, this.props.interaction);
    }

    componentDidUpdate() {
        d3.selectAll("g").remove();
        this.drawSPMatrixPlot(this.props.data, this.props.attributes, this.props.interaction);
    }

    drawSPMatrixPlot(data, attributes, interaction){

        var size = 300 - (25 * attributes.matrix.length),
            padding = 15;

        var x = d3.scaleLinear()
            .range([padding / 2, size - padding / 2]);

        var y = d3.scaleLinear()
            .range([size - padding / 2, padding / 2]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .ticks(6);

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(6);

        var color = d3.scaleOrdinal(attributes.colorScheme);

        var domainByTrait = {};

        var traits = attributes.matrix;

        var n = traits.length;

        // define the domains of each cell, based on slider values
        traits.forEach(function(trait, i) {
            domainByTrait[trait.attr] = [traits[i].slider.min, traits[i].slider.max]
        });

        xAxis.tickSize(size * n - 5);
        yAxis.tickSize(-size * n + 5);

        // define brush if the brush option is selected and when the user clicks and drags
        if (interaction === "brush") {
            var brush = d3.brush()
                .on("start", brushstart)
                .on("brush", brushmove)
                .on("end", brushend)
                .extent([[0,0],[size,size]]);
        }

        // Define colormapping of the dots and save the unique values in keys such that each key is a category.
        var colorAttribute = attributes.color;
        let unique = colorAttribute !== "" ? [...new Set(data.map(item => item[colorAttribute]))] : [];
        var keys = unique.sort(function(a,b) {
            return a - b;
        })
            .filter(key => {
                return key !== undefined && key !== null
            });

        // create SVG
        var svg = d3.select("#canvas")
            .attr("width", size * n + padding + 250)
            .attr("height", Math.max(size * n + padding + 20, 20 + keys.length * 30))
            .append("g")
            .attr("transform", "translate(" + (padding + 5) + "," + padding / 2 + ")");

        // Create svg for the legend
        var legend = svg.append('svg');
        // Set the horizontal position of the legend
        var xPosition = size * (traits.length) + 40;
        // For each category in the legend draw a coloured circle and add the category name.
        var i;
        for (i = 0; i < keys.length; i++) {
            legend.append("circle")
                .attr("cx",xPosition)
                .attr("cy", 20 + i * 30)
                .attr("r", 6)
                .style("fill", color(keys[i]));
            legend.append("text")
                .attr("x", xPosition + 20)
                .attr("y", 20 + i * 30)
                .text(keys[i])
                .style("font-size", "15px")
                .attr("alignment-baseline","middle")
        }

        // Scale x-axis to fit data
        svg.selectAll(".x.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function(d, i) {
                return "translate(" + (n - i - 1) * size + "," + 7 + ")";
            })
            .each(function(d) {
                x.domain(domainByTrait[d.attr]);
                d3.select(this).call(xAxis);
            })
            .select("path")
            .attr("stroke", 'none');

        // scale y-axis to fit data
        svg.selectAll(".y.axis")
            .data(traits)
            .enter()
            .append("g")
            .attr("class", "y axis ")
            .attr("transform", function(d, i) {
                return "translate(0," + i * size + ")";
            })
            .each(function(d) {
                y.domain(domainByTrait[d.attr]);
                d3.select(this).call(yAxis);
            })
            .select("path")
            .attr("stroke", 'none');

        // add squares to svg
        var cell = svg.selectAll(".cell")
            .data(cross(traits, traits))
            .enter()
            .append("g")
            .attr("class", "cell")
            .attr("transform", function(d) {
                return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")";
            })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function(d) {
                return d.i === d.j;
            })
            .append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".75em")
            .style("font-size", '12px')
            .text(function(d) {
                if (d.x.attr.length > 20) {
                    return d.x.attr.substring(0, 20) + '...';
                } else {
                    return d.x.attr;
                }
            });

        if (interaction === "brush") {  
            cell.call(brush);
        }

        /**
         * Function to plot the scatterplot matrix.
         *
         * @param p input scatterplot matrix
         */
        function plot(p) {
            var cell = d3.select(this);
            x.domain(domainByTrait[p.x.attr]);
            y.domain(domainByTrait[p.y.attr]);

            // add squares to the svg
            cell.append("rect")
                .attr("class", "frame")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", size - padding)
                .attr("height", size - padding);

            // add dots to the squares    
            cell.selectAll("circle")
                .data(data)
                .enter()
                .filter(function(d) {
                    if ((attributes.category != null)) {
                        return attributes.matrix.every(attribute => (
                            // If a category is selected, show only the the values of that one value
                            d[attribute.attr] !== null &&
                            d[attribute.attr] !== undefined &&
                            (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined)) &&
                            d[attributes.color] == attributes.category
                        ))
                    } else {
                        return attributes.matrix.every(attribute => (
                            // Show all categories and all with different colors
                            d[attribute.attr] !== null &&
                            d[attribute.attr] !== undefined &&
                            (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined))
                        ))
                    }
                })
                .append("circle")
                .attr("cx", function(d) {
                    return x(d[p.x.attr]);
                })
                .attr("cy", function(d) {
                    return y(d[p.y.attr]);
                })
                .attr("r", 2.5)
                .attr("opacity", 0.75)
                .style("fill",  function (d) {
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
                .on('mouseover', interaction === "hover" ? handleMouseOver : null )
                .on('mouseout', interaction === "hover" ? handleMouseOut : null)
        }

        var brushCell;

        /**
         * Clear the previously-active brush, if any.
         *
         * @param event
         * @param p input scatterplot matrix
         */
        function brushstart(event, p) {
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
                x.domain(domainByTrait[p.x.attr]);
                y.domain(domainByTrait[p.y.attr]);
            }
        }

        /**
         * Highlight the selected circles.
         *
         * @param event
         * @param p input scatterplot matrix
         */
        function brushmove(event, p) {
            var e = d3.brushSelection(this);
            svg.selectAll("circle").attr("opacity", function(d) {
                if (d !== undefined) {
                    if (e && (e[0][0] > x(d[p.x.attr]) ||
                            x(d[p.x.attr]) > e[1][0] ||
                            e[0][1] > y(d[p.y.attr]) ||
                            y(d[p.y.attr]) > e[1][1])) {
                        return 0.1;
                    } else  {
                        return 0.75;
                    } 
                }
            });
        }

        /**
         * If the brush is empty, select all circles.
         */
        function brushend() {
            var e = d3.brushSelection(this);
            if (e === null) svg.selectAll("circle").attr("opacity", 0.75);
        }

        /**
         * Calculates the data contained in a cell based on cell position
         * @param a
         * @param b
         * @returns {[]}
         */
        function cross(a, b) {
            var c = [], n = a.length, m = b.length, i, j;
            for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
            return c;
        }

        /**
         * If the hover button is clicked, show information when hoovering over a data point and
         * increase dot size and opacity and decrease other dot opacities.
         *
         * @param event
         * @param data
         */
        function handleMouseOver(event, data) {
            d3.select("#output")
                .selectAll("*")
                .remove()

            traits.forEach(dimension => 
                d3.select("#output")
                    .append("div")
                    .attr("class", "output")
                    .html(dimension.attr + ": " + data[dimension.attr])
            );

            if (attributes.color) {
                d3.select("#output")
                    .append("div")
                    .attr("class", "output")
                    .html(attributes.color + ": " + data[attributes.color]);
            }

            d3.selectAll("circle").attr("opacity", 0.1);
            legend.selectAll("circle").attr("opacity", 1);
            d3.select(this).transition()    // increase dot size on mouse entering
                .duration('30')
                .attr("r", 5.5)
                .attr("opacity", 1);
        }

        /**
         * Update output panel text when hoovering stopped and restore opacities and dot sizes
         *
         * @param event
         * @param data
         */
        function handleMouseOut(event, data) {
            d3.selectAll("circle").attr("opacity", 1);
            d3.select("#output").selectAll("*").remove()
            d3.select(this).transition().duration(50).attr("r", 2.5)
        }
    }
    
    render() {
        return <svg id='canvas'/>
    }
}

export default SPMatrix;
