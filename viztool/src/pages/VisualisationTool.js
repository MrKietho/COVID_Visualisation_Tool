import React, {Component} from "react";
import "../styling/App.css";
import OutputPanel from "../components/OutputPanel";
import MainPanel from "../components/MainPanel";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import InputPanel from "../components/InputPanel";
import * as d3 from 'd3';
import { processData } from '../parser/parserV2';
import Papa from 'papaparse';
import {Snackbar} from "@material-ui/core";


/**
 * Shows the visualisation tool.
 */
class VisualisationTool extends Component {

    constructor() {
        super();

        this.updateAttributes = this.updateAttributes.bind(this);
        this.updateSelectedInteraction = this.updateSelectedInteraction.bind(this);
        this.setData = this.setData.bind(this);

        this.defaultColorScheme =
            ["#377eb8", "#e41a1c", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"];

        const colorOptions = [
                { name: "Scheme 1", scheme: this.defaultColorScheme },
                { name: "Scheme 2", scheme: d3.schemeCategory10 },
                { name: "Scheme 3", scheme: d3.schemeDark2 },
                { name: "Scheme 4", scheme: d3.schemeSet3.concat(d3.schemeSet2)}
            ];

        const interactionOptions = ["hover", "brush", "box zoom"];

        // Defines the state of the website, all the objects and inputs from the input panel that are used in the visualisations are stored in here.
        this.state = {
            visualisation: "",
            attributes: {x: null, y: null, color: "", category: "", opacity: "",
                    pc: [], matrix: [], pc_matrix: [], colorScheme: colorOptions[0].scheme},
            selectedAttributes: [],
            attributeChoices: {numerical: [], categorical: []},
            selectedInteraction: interactionOptions[0],
            colorSchemeOptions: colorOptions,
            data: null,
            snackbar: "layout",
        };
    }

    // After the page has loaded, parse the dataset using our parse tool
    componentDidMount() {   
        Papa.parse("https://raw.githubusercontent.com/JasperGeelen/datasetsForVisualisation/main/dataset.csv", {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: this.setData
        })
    }

    // Parse the data using our tool and then store the parsed data in the state
    setData(results) {
        let parsedData = processData(results.data);
        this.setState({
            attributeChoices: {numerical: parsedData.numAttributes, categorical: Object.keys(parsedData.catAttributes)},
            data: parsedData.data
        })
    }

    // When the attributes change in the input panel, store the change and save it in the state
    updateAttributes(attr) {
        this.setState({
            attributes: attr
        });

        let newSelectedAttributes = [];
        for (const attribute in attr) { // if a new attribute is selected/deleted, update the selectedAttributes state
            if (attr[attribute] && !Array.isArray(attr[attribute]) && attribute !== "colorScheme") {
                newSelectedAttributes.push(attr[attribute])
            } else if (attr[attribute] && Array.isArray(attr[attribute]) && attribute !== "colorScheme") {
                newSelectedAttributes = newSelectedAttributes.concat(attr[attribute])
            } 
        }

        this.setState({
            selectedAttributes: newSelectedAttributes
        });

        // Make sure that the snackbars are updated accordingly
        this.handleSnackbars(attr, this.state.visualisation);
    }

    // When an interaction button gets pressed, save the new value in the state
    updateSelectedInteraction(interaction) {
        this.setState({
            selectedInteraction: interaction
        })
    }

    // This method handles snackbars and checks what snackbar should be returned, if any.
    handleSnackbars(attr, visualisation) {
        let x = attr.x;
        let y = attr.y;
        let scatterValid = (visualisation === "Scatterplot");
        let pcValid = (visualisation === "Parallel Coordinate");
        let smValid = (visualisation === "Scatterplot Matrix");
        let pcsmValid = (visualisation === "PC and SPM");

        // If SP is selected and an x-axis is selected, then remove x-axis snackbar
        if (scatterValid) {
            if ( !x ) {
                this.setState( { snackbar: "x" } );
            } else if ( x && !y ) {
                this.setState( { snackbar: "y" } );
            } else if ( x && y ) {
                this.setState( { snackbar: "" } );
            }
        } else if ( pcValid ) {
            // If PC is selected, check whether right nr of attributes is selected
            this.setState( { snackbar: "attr" } );

            if ( attr.pc.length >= 2 && attr.pc.length <= 6 ) {
                this.setState( { snackbar: "" } );
            }
        } else if ( smValid ) {
            // If SPM is selected, check whether the right nr of attributes is selected
            this.setState( { snackbar: "attr" } );

            if ( attr.matrix.length >= 2 && attr.matrix.length <= 6 ) {
                this.setState( { snackbar: "" } );
            }
        } else if ( pcsmValid ) {
            // If PC and SPM is selected, check whether the right nr of attributes is selected
            this.setState( { snackbar: "attr" } );

            if ( attr.pc_matrix.length >= 2 && attr.pc_matrix.length <= 6 ) {
                this.setState( { snackbar: "" } );
            }
        }
    }

    render() {
        const visualisationOptions = [  // defines all the different visualisation options
            "Scatterplot",
            "Scatterplot Matrix",
            "Parallel Coordinate",
            "PC and SPM",
        ];

        const interactionOptions = ["hover", "brush", "box zoom"];

        // The snackbars with the necessary text to guide the user
        const vert = 'bottom'
        const horiz = 'right'
        const snackbars =
            <div>
                <Snackbar
                    anchorOrigin={{ vertical: vert, horizontal: horiz }}
                    open= { this.state.snackbar === "layout" }
                    message="Select a layout."
                />

                {/* x-axis snackbar */}
                <Snackbar
                    anchorOrigin={{ vertical: vert, horizontal: horiz }}
                    open= { this.state.snackbar === "x" }
                    message="Select an x-axis."
                />

                {/* y-axis snackbar */}
                <Snackbar
                    anchorOrigin={{ vertical: vert, horizontal: horiz }}
                    open= { this.state.snackbar === "y" }
                    message="Select an y-axis."
                />

                {/* PC / SPM / PC and SPM attributes dropdown */}
                <Snackbar
                    anchorOrigin={{ vertical: vert, horizontal: horiz }}
                    open= { this.state.snackbar === "attr" }
                    message="Select between two and six attributes."
                />
            </div>

        // Render everything below
        return(
            <div className="VisualisationTool">

                { snackbars }

                {/* Place the side panel with input and output panel. */}
                <div className="SidePanel">
                    {/* Place the dropdown to choose which visualisation to show in the main view */}
                    <div className = "VisualisationDropdown">
                        <Autocomplete
                            id="combo-box-visualisationChoice"
                            size = "small"
                            options={visualisationOptions}
                            getOptionLabel={(option) => option}
                            onInputChange={ (event, newInputValue) => {
                                // After a new selection is made, save the change
                                this.setState( {
                                    visualisation: newInputValue,
                                    selectedAttributes: [],
                                    attributes: {
                                        x: null, y: null, color: "", opacity: "", pc: [], matrix: [],
                                        pc_matrix: [],colorScheme: this.defaultColorScheme
                                    },
                                    selectedInteraction:
                                        newInputValue === "Scatterplot" ||
                                        newInputValue === "PC and SPM"
                                            ? "hover" :
                                            newInputValue === "Scatterplot Matrix" ||
                                            newInputValue === "Parallel Coordinate" ? "brush" : ""
                                });
                                this.handleSnackbars(this.state.attributes, newInputValue);
                            }}
                            renderInput={ (params) =>
                                <TextField {...params} label="Visualisation choice" variant="outlined" />
                            }
                        />
                    </div>
                    {/* Renders the input panel and communicates the needed state data and the methods used to update the state */}
                    <div className = "InputPanel"> 
                        <InputPanel visualisation = {this.state.visualisation}
                                    attributes = {this.state.attributes}
                                    attributeChoices = {this.state.attributeChoices}
                                    selectedAttributes = {this.state.selectedAttributes}
                                    updateAttributes = {this.updateAttributes}
                                    interactionOptions = { interactionOptions }
                                    selectedInteraction = { this.state.selectedInteraction }
                                    colorSchemeOptions = {this.state.colorSchemeOptions}
                                    updateSelectedInteraction = {this.updateSelectedInteraction}
                                    data = {this.state.data}
                        />
                    </div>

                    <OutputPanel/>
                </div>

                {/* The rest is the main view, where the selected visualisation is shown.  */}
                <div className="VisualisationMainView">
                    <div className="Margin">
                        <MainPanel visualisation = {this.state.visualisation}
                                   attributes = {this.state.attributes}
                                   selectedAttributes = {this.state.selectedAttributes}
                                   data = {this.state.data}
                                   interaction = {this.state.selectedInteraction}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default VisualisationTool;
