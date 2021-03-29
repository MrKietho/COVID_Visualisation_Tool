import React, {Component} from 'react';
import * as d3 from 'd3';
import "../styling/SPMatrix.css";

class SPM_PC extends Component {

    constructor(props) {
        super(props);
        this.data = this.props.data;
        
        this.title = "Scatterplot Matrix and Parallel coordinates";

        const margin_pc = {top: 20, right: 30, bottom: 0, left: 40};    // margins
        const margin_spm = {top: 20, right: 20, bottom: 0, left: 35};
        
        this.size = {};

        this.size.pc = {
            margin: margin_pc,
            width: window.screen.width / 1.5 - margin_pc.left - margin_pc.right,    // width and height of pc
            height: (window.screen.height / 4) - margin_pc.top - margin_pc.bottom
        };

        this.size.spm = {
            margin: margin_spm,
            width: 1600 - margin_spm.left - margin_spm.right,
            height: (window.screen.height * 3 / 4) - margin_spm.top - margin_spm.bottom
        };

        this.drawSPM_PC = this.drawSPM_PC.bind(this);
    }

    componentDidMount() {
        this.drawSPM_PC(this.data, this.size, this.props.attributes, this.props.interaction);
    }

    componentDidUpdate() {
        d3.selectAll("g").remove();
        this.drawSPM_PC(this.data, this.size, this.props.attributes, this.props.interaction);
    }

    /**
     * Draws the layout for both the scatterplot matrix and parallel coordinates.
     *
     * @param data is the input data
     * @param size is the size of the plots
     * @param attributes are the input attributes
     * @param interaction is the selected interaction technique
     */
    drawSPM_PC(data, size, attributes, interaction) {

        var size_spm = 190 - (15 * attributes.pc_matrix.length), padding = 14;  // size and padding of each cell
        var size_pc = 170;  // space between each axis

        let click = false;

        // Define colormapping of the dots and save the unique values in keys such that each key is a category.
        var colorAttribute = attributes.color;
        let unique = colorAttribute !== "" ? [...new Set(data.map(item => item[colorAttribute]))] : [];
        var keys = unique.sort(function(a,b) {
            return a - b;
        })
            .filter(key => {
                return key !== undefined && key !== null
            });

        // append the svg object to the body of the page
        var svg_pc = d3.select("#canvas_pc")
            .attr("width", size.pc.width + size.pc.margin.left + size.pc.margin.right)
            .attr("height",
                Math.max(size.pc.height + size.pc.margin.top + size.pc.margin.bottom, window.screen.height / 4))
            .on("click", () => {    // deselect selected dot if clicked outside of dot
                if (interaction !== "brush" && click && selected.length !== 0) { 
                    selected.pop(); 
                    d3.selectAll("circle").attr("opacity", 1).attr("r", 3.0 - (0.14 * dimensions.length));
                    d3.select("#output").selectAll("*").remove()
                    d3.selectAll('.line')
                        .style("opacity", '0.5')
                        .style("stroke-width", '1'); 
                    click = !click
                } else (click = !click)
            })
            .append("g")
            .attr("transform", "translate(" + size.pc.margin.left + "," + size.pc.margin.top + ")");

        let selected = []   // stores the dot that was selected by clicking on it
        
        var color = d3.scaleOrdinal(attributes.colorScheme);    // define the colors based on the color scheme

        var x = d3.scaleLinear()
            .range([padding / 2, size_spm - padding / 2]);

        var y = d3.scaleLinear()
            .range([size_spm - padding / 2, padding / 2]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .ticks(6);

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(6);

        var domainByTrait = {};

        var traits = attributes.pc_matrix;

        var n = traits.length;

        // define the domains of each cell, based on slider values (not used)
        traits.forEach(function(trait, i) {
            domainByTrait[trait.attr] = [traits[i].slider.min, traits[i].slider.max];
        });

        xAxis.tickSize(size_spm * n - 5);
        yAxis.tickSize(-size_spm * n + 5);

        // store all dimensions
        var dimensions = [];
        attributes.pc_matrix.forEach(element =>
            dimensions.push(element.attr)
        );

        // For each dimension build a linear scale.
        var y_pc = {};
        for (let i in dimensions) {
          const name = dimensions[i]
          y_pc[name] = d3.scaleLinear()
            .domain( d3.extent(data, function(d) {
                return +d[name];
            }))
            .range([size.pc.height, 0])
        }      

        // Build the X scale -> it find the best position for each Y axis
        let x_pc = d3.scalePoint()
            .range([0, size_pc * (dimensions.length-1)])
            .domain(dimensions);     

        /**
         * Path takes a row of the csv as input, and return x and y coordinates of the line to draw for this row.
         * @param d
         * @returns {*} the x and y coordinates of the line to draw.
         */
        function path(d) {
            return d3.line()(dimensions.map(function(p) { return [x_pc(p), y_pc[p](d[p])]; }));
        }      

        // Create svg for the legend
        var legend = svg_pc.append('g')
        // Set the horizontal position of the legend
        var xPosition = size_pc * (dimensions.length-1) + size.pc.margin.left + (size.pc.margin.right * 2);
        // For each category in the legend draw a coloured circle and add the category name.
        var i;
        for (i = 0; i < keys.length; i++) {
            var rowY = (i % 10);
            var rowNumber = Math.floor(i / 10);
            legend.append("circle")
                .attr("cx", xPosition + rowNumber * 60)
                .attr("cy", 10 + (rowY * 25))
                .attr("r", 6)
                .style("fill", color(keys[i]));
            legend.append("text")
                .attr("x", xPosition + rowNumber * 60 + 15)
                .attr("y", 10 + (rowY * 25))
                .text(keys[i])
                .style("font-size", "13px")
                .attr("alignment-baseline", "middle");
        }

        // Draw the lines
        svg_pc
            .selectAll("myPath")
            .data(data)
            .enter()
            .filter(function(d) {
                if ((attributes.category != null)) {
                    return attributes.pc_matrix.every(attribute => (
                        // If a category is selected, show only the the values of that one value.
                        d[attribute.attr] !== null &&
                        d[attribute.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined)) &&
                        d[attributes.color] == attributes.category
                    ))
                } else {
                    return attributes.pc_matrix.every(attribute => (
                        // Show all categories and all with different colors.
                        d[attribute.attr] !== null &&
                        d[attribute.attr] !== undefined &&
                        (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined))
                    ))
                }
            })
            .append("path")
            .attr("class", function (d) {
                return "line " + d[attributes.color]
            })
            .attr("d", path)
            .style("fill", "none")
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
                return ((attributes.color) ? color(d[attributes.color]) : "#377eb8");
            })
            .style("stroke-width", "0.7")
            .style("opacity", 0.5)
            .on('mouseover', interaction === "hover" ? handleMouseOver : null)
            .on('mouseout', interaction === "hover" ? handleMouseOut : null)
            .on("click", handleMouseClick);

        // Draw the axis:
        svg_pc.selectAll("myAxis")
          // For each dimension of the dataset I add a 'g' element:
          .data(dimensions).enter()
          .append("g")
          .attr("class", "axis_PC")
          // Translate the element to its right position on the x axis
          .attr("transform", function(d) { return "translate(" + x_pc(d) + ")"; })
          // Build the axis
          .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y_pc[d])); })
          // Add axis title
          .append("text")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .attr("y", -9)
            .text(function(d) { return d; })
            .style("fill", "black")


        /**
         * SPM part of the layout
         */

         // draw the scatterplot matrix
        var svg_spm = d3.select("#canvas_spm")
            .attr("width", size_spm * n + padding + size.spm.margin.left + size.spm.margin.right)
            .attr("height",
                Math.min(size_spm * n + padding + size.spm.margin.top + size.spm.margin.bottom,
                    window.screen.height * 3 / 4 - 150))
            .on("click", () => {    // deselect selected dot
                if (click && selected.length !== 0) { 
                    selected.pop(); 
                    d3.selectAll("circle").attr("opacity", 1).attr("r", 3.0 - (0.14 * dimensions.length));
                    d3.select("#output").selectAll("*").remove()
                    d3.selectAll('.line')
                        .style("opacity", '0.5')
                        .style("stroke-width", '1'); 
                    click = !click
                } else (click = !click)
                })
            .append("g")
            .attr("transform", "translate(" + (padding + size.spm.margin.left) + "," + padding / 2 + ")");

        // define brush if the brush option is selected and when the user clicks and drags
        if (interaction === "brush") {
            var brush = d3.brush()
                .on("start", brushstart)
                .on("brush", brushmove)
                .on("end", brushend)
                .extent([[0,0],[size_spm,size_spm]]);
        }

        // draw the x and y axis of the scatterplotmatrix
        svg_spm.selectAll(".x.axis")
            .data(traits)
            .enter()
            .append("g")
            .attr("class", "x axis")
            .attr("transform", function(d, i) {
                return "translate(" + (n - i - 1) * size_spm + "," + 7 + ")";
            })
            .each(function(d) {
                x.domain(domainByTrait[d.attr]);
                d3.select(this).call(xAxis);
            })
            .select("path")
            .attr("stroke", 'none');

        svg_spm.selectAll(".y.axis")
            .data(traits)
            .enter()
            .append("g")
            .attr("class", "y axis")
            .attr("transform", function(d, i) {
                return "translate(0," + i * size_spm + ")";
            })
            .each(function(d) {
                y.domain(domainByTrait[d.attr]);
                d3.select(this).call(yAxis);
            })
            .select("path")
            .attr("stroke", 'none');

        // draw all the cells inside the scatterplotmatrix
        var cell = svg_spm.selectAll(".cell")
            .data(cross(traits, traits))
            .enter()
            .append("g")
            .attr("class", "cell")
            .attr("transform", function(d) {
                return "translate(" + (n - d.i - 1) * size_spm + "," + d.j * size_spm + ")";
            })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function(d) {
                return d.i === d.j;
            })
            .append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .style("font-size", '12px')
            .text(function(d) {
                if (d.x.attr.length > 15) {
                    return d.x.attr.substring(0, 15) + '...'
                } else {
                    return d.x.attr
                }
            });

        // If brush is selected, make sure the functionality for brushing is selected
        if (interaction === "brush") {
            cell.call(brush);
        }

        /**
         * Fills all the cells with dots and plots the cells
         *
         * @param p
         */
        function plot(p) {
            var cell = d3.select(this);
            x.domain(domainByTrait[p.x.attr]);
            y.domain(domainByTrait[p.y.attr]);

            // Draw a rectangle for the border of each scatter plot
            cell.append("rect")
                .attr("class", "frame")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", size_spm - padding)
                .attr("height", size_spm - padding);

            cell.selectAll("circle")
                .data(data)
                .enter()
                .filter(function(d) {
                    if ((attributes.category != null)) {
                        // If a category is selected, show only the the values of that one value.
                        return attributes.pc_matrix.every(attribute => (
                            d[attribute.attr] !== null &&
                            d[attribute.attr] !== undefined &&
                            (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined)) &&
                            d[attributes.color] == attributes.category
                        ));
                    } else {
                        return attributes.pc_matrix.every(attribute => (
                            // Show all categories and all with different colors.
                            d[attribute.attr] !== null &&
                            d[attribute.attr] !== undefined &&
                            (!attributes.color || (d[attributes.color] !== null && d[attributes.color] !== undefined))
                        ));
                    }
                })
                .append("circle")
                .attr("cx", function(d) {
                    return x(d[p.x.attr]);
                })
                .attr("cy", function(d) {
                    return y(d[p.y.attr]);
                })
                .attr("r", 3.0 - (0.14 * dimensions.length))
                .attr("opacity", 0.75)
                .style("fill", function (d) {
                    return ((attributes.color) ? color(d[attributes.color]) : "#377eb8");
                })
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut)
                .on("click", handleMouseClick);
        }

        var brushCell;

        /**
         * Clears the previously-active brush, if any.
         *
         * @param event
         * @param p
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
         * Highlights the selected circles.
         *
         * @param event
         * @param p
         */
        function brushmove(event, p) {
            selected = []
            var e = d3.brushSelection(this);
            svg_spm.selectAll("circle")
                .attr("opacity", function(d) {
                    if (e && (e[0][0] > x(d[p.x.attr]) ||
                            x(d[p.x.attr]) > e[1][0] ||
                            e[0][1] > y(d[p.y.attr]) ||
                            y(d[p.y.attr]) > e[1][1])) {
                        return 0.1;
                    } else  {
                        selected.push(d["Patient ID"]);
                        return 1;
                    }
                });

            // increase the opacity of dots under the brush, decrease opacity of dots outside of brush
            svg_pc.selectAll(".line").style("opacity", 0.1);
            svg_pc.selectAll(".line")
                .filter(d => {
                    return d && selected.includes(d['Patient ID']);
                })
                .style("opacity", 0.65)
                .style("stroke-width", 1.2);
        }

        /**
         * If the brush is empty, select all circles.
         */
        function brushend() {
            selected = []
            var e = d3.brushSelection(this);
            if (e === null) {
                svg_spm.selectAll("circle").attr("opacity", 0.75);
                svg_pc.selectAll(".line").style("opacity", 0.5);
                svg_pc.selectAll(".line").style("stroke-width", 0.8);
            }
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
         * If the hover button is clicked, show information when hoovering over a data point
         * @param event
         * @param data
         */
        function handleMouseOver(event, data) {
            if (selected.length === 0) {

                // update output panel text
                d3.select("#output")
                    .selectAll("*")
                    .remove()

                d3.select("#output")
                    .append("div")
                    .attr("class", "output")
                    .html("ID: " + data["Patient ID"])

                dimensions.forEach(dimension => {
                    d3.select("#output")
                        .append("div")
                        .attr("class", "output")
                        .html(dimension + ": " + data[dimension])})

                if (attributes.color) {
                    d3.select("#output")
                        .append("div")
                        .attr("class", "output")
                        .html(attributes.color + ": " + data[attributes.color])
                }

                d3.selectAll("circle")
                    .attr("opacity", 0.05);

                legend.selectAll("circle")
                    .attr("opacity", 1);

                d3.selectAll('.line')
                    .style('opacity', '0.05');

                // increase dot of matching dots and decrease opacity of others
                d3.selectAll('circle')
                    .filter(d => {return d && d['Patient ID'] === data['Patient ID']})
                    .attr("r", 4.5 - (0.14 * dimensions.length))
                    .attr("opacity", 1);

                d3.selectAll('.line')
                    .filter(d => {return d && d['Patient ID'] === data['Patient ID']})
                    .style("opacity", '0.75')
                    .style("stroke-width", '1.8');
            }
        }

        /**
         * Update output panel text and dot when no more hoovering over a data point
         *
         * @param event
         * @param data
         */
        function handleMouseOut(event, data) {
            if (selected.length === 0) {
                d3.selectAll("circle")
                    .attr("opacity", 0.75);

                d3.select("#output")
                    .selectAll("*")
                    .remove();

                d3.select(this)
                    .attr("r", 3.0 - (0.14 * dimensions.length));

                d3.selectAll('.line')
                    .style("opacity", '0.5')
                    .style("stroke-width", '0.8');
            }
        }

        /**
         * After clicking on a data point, select it, increasing its size and decreasing opacity of over dots
         *
         * @param event
         * @param data
         */
        function handleMouseClick(event, data) {
            if (selected.includes(data['Patient ID']) || selected.length !== 0) {
                selected.pop();
            } else {
                selected.pop();
                selected.push(data['Patient ID']);

                d3.select("#output")
                    .selectAll("*")
                    .remove();

                d3.select("#output")
                    .append("div")
                    .attr("class", "output")
                    .html("ID: " + data["Patient ID"]);

                dimensions.forEach(dimension => {
                    d3.select("#output")
                        .append("div")
                        .attr("class", "output")
                        .html(dimension + ": " + data[dimension])
                });

                if (attributes.color) {
                    d3.select("#output")
                        .append("div")
                        .attr("class", "output")
                        .html(attributes.color + ": " + data[attributes.color]);
                }

                d3.selectAll("circle")
                    .attr("opacity", 0.05);

                legend.selectAll("circle")
                    .attr("opacity", 1);

                d3.selectAll('.line')
                    .style('opacity', '0.05');

                // increase dot of matching dots and decrease opacity of others
                d3.selectAll('circle')
                    .filter(d => {
                        return d && d['Patient ID'] === data['Patient ID']
                    })
                    .attr("r", 5.5 - (0.14 * dimensions.length))
                    .attr("opacity", 1);

                d3.selectAll('.line')
                    .filter(d => {
                        return d && d['Patient ID'] === data['Patient ID']
                    })
                    .style("opacity", '1')
                    .style("stroke-width", '2.4');
            }
        }
    }

    render() {
        return (
            <div>
                <svg id='canvas_pc'/>
                <svg id='canvas_spm'/>
            </div>
        )
    }

}

export default SPM_PC;
