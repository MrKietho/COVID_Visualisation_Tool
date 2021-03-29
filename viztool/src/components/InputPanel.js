import React, {Component} from "react";
import "../styling/SidePanel.css";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";
import {Slider} from "@material-ui/core";
import BrushIcon from '@material-ui/icons/Brush';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import InfoIcon from '@material-ui/icons/Info';
import {ToggleButton, ToggleButtonGroup} from "@material-ui/lab";

/**
 * This class represents the component input panel.
 * Every layout has a different input and in this class, each is defined accordingly.
 */
class InputPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            slider: {},
        }
    }

    /**
     * handleAttributeChange handles attributes state and the slider state.
     * If a new numerical attribute is added, then a slider for this attribute is added.
     * If an attribute with a slider has been deselected, then the slider is also removed.
     *
     * @param attributes are the selected attributes by the user.
     * @param key visualisation input type
     */
    handleAttributeChange(attributes, key) {
        // Go through all attributes and add sliders
        for (const attribute in attributes) {

            // If any numerical attributes are selected, show the slider for these attributes
            if (attributes[attribute] !== null) {
                let sliderValues = this.state.slider;
                sliderValues[attributes[attribute].attr] =
                    [attributes[attribute].slider.min, attributes[attribute].slider.max];
                this.setState({slider: sliderValues});
            }
            
            let changedAttr = this.props.attributes;

            if (Array.isArray(changedAttr[key])) {
                changedAttr[key] = attributes;
            } else { 
                changedAttr[key] = attributes[attribute];
            }

            this.props.updateAttributes(changedAttr);
        }

        // Update attributes if none are selected
        if (attributes.length === 0) {
            let changedAttr = this.props.attributes;
            changedAttr[key] = attributes;
            this.props.updateAttributes(changedAttr);
        }
    }

    /**
     * This methods returns the selected attributes in an array.
     * This is used for the sliders.
     *
     * @returns {[]} an array in which the selected attributes are given
     */
    getSelectedAttributes() {
        let newSelectedAttributes = [];

        // Go through all selected attributes
        for (const attribute in this.props.attributes) {
            // If the attribute is numerical, return a slider for this attribute
            if (this.props.attributes[attribute] &&
                    attribute !== "color" && attribute !== "category" && attribute !== "colorScheme") {
                // Push the selected attributes in an array, also if there are multiple
                if (!Array.isArray(this.props.attributes[attribute])) {
                    let attr = this.props.attributes[attribute];
                    attr.key = attribute;
                    newSelectedAttributes.push(attr);
                } else if (Array.isArray(this.props.attributes[attribute])
                        && attribute !== "category" && attribute !== "colorScheme") {
                    this.props.attributes[attribute].forEach(attr => {
                        let attrib = attr;
                        attrib.key = attribute;
                        newSelectedAttributes.push(attrib);
                    })
                } 
            }
        }
        return newSelectedAttributes;
    }

    render() {

        // Initialise the input channel elements
        let SPInput, PCInput, SPMatrixInput, PC_SPMInput;
        let sliders, SPInteractions, OtherInteractions;

        var colorAttribute = this.props.attributes.color;

        // define colormapping of the dots
        var unique = colorAttribute !== "" ? [...new Set(this.props.data.map(item => item[colorAttribute]))] : [];

        // defines the category options
        var keys = unique.sort(function(a,b) {
            return a - b;
        })
            .filter(key => {

                return key !== undefined && key !== null
            });

        keys = keys.map(String)

        /**
         * Input panel implementation for the scatter plot layout.
         * @type {JSX.Element}
         */
        SPInput =
            <div>
                <div className="IP_column">
                    <div className="IP_item">
                        {/* x-axis dropdown */}
                        <Autocomplete
                            id = "SP-X"
                            size = "small"
                            options = { this.props.attributeChoices.numerical }
                            getOptionLabel = { (option) => option.attr }
                            getOptionSelected = { (option, value) => option.attr === value.attr }
                            onChange = { (event, newInputValue) => {
                                    this.handleAttributeChange([newInputValue], 'x');
                                }
                            }
                            renderInput = { (params) =>
                                <TextField {...params} label="Attribute for x-axis" variant="outlined" />
                            }
                        />
                    </div>
                    <div className="IP_item">
                        {/* y-axis dropdown */}
                        <Autocomplete
                            id = "SP-Y"
                            size = "small"
                            options = { this.props.attributeChoices.numerical }
                            getOptionLabel = { (option) => option.attr }
                            getOptionSelected = { (option, value) => option.attr === value.attr }
                            onChange = { (event, newInputValue) => {
                                    this.handleAttributeChange([newInputValue], 'y');
                                }
                            }
                            renderInput = {(params) =>
                                <TextField {...params} label="Attribute for y-axis" variant="outlined" />
                            }
                        />
                    </div>

                    <div className="IP_item">
                        {/* color attribute dropdown */}
                        <Autocomplete
                            id = "SP-Color"
                            size = "small"
                            options = { this.props.attributeChoices.categorical }
                            filterSelectedOptions
                            onChange = { (event, newInputValue) => {
                                    let changedAttr = this.props.attributes;
                                    changedAttr['color'] = newInputValue;
                                    this.props.updateAttributes(changedAttr);
                                }
                            }
                            renderInput = { (params) =>
                                <TextField {...params} label="Attribute for colors" variant="outlined" />
                            }
                        />
                    </div>

                    <div className= "IP_row">
                        <div className="IP_row_item">
                            {/* categories dropdown */}
                            <Autocomplete
                                id = "category"
                                size = "small"
                                options = { keys }
                                // getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let changedAttr = this.props.attributes;
                                    changedAttr['category'] = newInputValue;
                                    this.props.updateAttributes(changedAttr);
                                }}
                                renderInput = { (params) =>
                                    <TextField {...params} label="Category" variant="outlined" />
                                }
                            />
                        </div>
                        <div className="IP_row_item">
                            {/* Dropdown for the color scheme options */}
                            <Autocomplete
                                id = "colorPicker"
                                size = "small"
                                disableClearable
                                options = { this.props.colorSchemeOptions }
                                defaultValue = { this.props.colorSchemeOptions[0] }
                                getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let newScheme = this.props.attributes;
                                    newScheme.colorScheme = newInputValue.scheme;
                                    this.props.updateAttributes(newScheme);
                                }}
                                renderInput={(params) =>
                                    <TextField {...params} label="Color scheme" variant="outlined" />
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>;

        /**
         * Input panel implementation for the parallel coordinates plot layout.
         * @type {JSX.Element}
         */
        PCInput = 
            <div>
                <div className="IP_column">
                    <div className="IP_item">
                        {/* dropdown for the selecting multiple numerical attributes */}
                        <Autocomplete
                            multiple
                            filterSelectedOptions
                            id = "PC-attributes"
                            size = "small"
                            options = { this.props.attributeChoices.numerical }
                            getOptionLabel = { (option) => option.attr }
                            onChange = { (event, newInputValue) => {
                                this.handleAttributeChange(newInputValue, 'pc')
                            }}
                            renderInput = {(params) =>
                                <TextField {...params} label="Numerical attributes" variant="outlined" />
                            }
                        />
                    </div>
                    <div className="IP_item">
                        {/* Dropdown for the color attributes */}
                        <Autocomplete
                            id = "PC-Color"
                            size = "small"
                            options = { this.props.attributeChoices.categorical }
                            filterSelectedOptions
                            onChange = { (event, newInputValue) => {
                                let changedAttr = this.props.attributes;
                                changedAttr['color'] = newInputValue;
                                this.props.updateAttributes(changedAttr);
                            }}
                            renderInput={(params) =>
                                <TextField {...params} label="Attribute for colors" variant="outlined" />
                            }
                        />
                    </div>
                    <div className= "IP_row">
                        <div className="IP_row_item">
                            {/* categories dropdown */}
                            <Autocomplete
                                id = "category"
                                size = "small"
                                options = { keys }
                                // getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let changedAttr = this.props.attributes;
                                    changedAttr['category'] = newInputValue;
                                    this.props.updateAttributes(changedAttr);
                                }}
                                renderInput = { (params) =>
                                    <TextField {...params} label="Category" variant="outlined" />
                                }
                            />
                        </div>
                        <div className="IP_row_item">
                            {/* Dropdown for the color scheme options */}
                            <Autocomplete
                                id = "colorPicker"
                                size = "small"
                                disableClearable
                                options = { this.props.colorSchemeOptions }
                                defaultValue = { this.props.colorSchemeOptions[0] }
                                getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let newScheme = this.props.attributes;
                                    newScheme.colorScheme = newInputValue.scheme;
                                    this.props.updateAttributes(newScheme);
                                }}
                                renderInput={(params) =>
                                    <TextField {...params} label="Color scheme" variant="outlined" />
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>;

        /**
         * Input panel implementation for the scatter plot matrix layout.
         * @type {JSX.Element}
         */
        SPMatrixInput = 
            <div>
                <div className="IP_column">
                    <div className="IP_item">
                        {/* dropdown for the selecting multiple numerical attributes */}
                        <Autocomplete
                            multiple
                            id = "SPMatrix-attributes"
                            size = "small"
                            options = { this.props.attributeChoices.numerical }
                            getOptionLabel = { (option) => option.attr }
                            filterSelectedOptions
                            onChange = { (event, newInputValue) => {
                                this.handleAttributeChange(newInputValue, 'matrix')
                            }}
                            renderInput={ (params) =>
                                <TextField {...params} label="Attributes" variant="outlined" />
                            }
                        />
                    </div>
                    <div className="IP_item">
                        {/* Dropdown for the color attributes */}
                        <Autocomplete
                            id = "SPM-Color"
                            size = "small"
                            options = {this.props.attributeChoices.categorical}
                            filterSelectedOptions
                            onChange = { (event, newInputValue) => {
                                let changedAttr = this.props.attributes;
                                changedAttr['color'] = newInputValue;
                                this.props.updateAttributes(changedAttr);}}
                            renderInput={(params) =>
                                <TextField {...params} label="Attribute for colors" variant="outlined" />
                            }
                        />
                    </div>
                    <div className= "IP_row">
                        <div className="IP_row_item">
                            {/* categories dropdown */}
                            <Autocomplete
                                id = "category"
                                size = "small"
                                options = { keys }
                                // getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let changedAttr = this.props.attributes;
                                    changedAttr['category'] = newInputValue;
                                    this.props.updateAttributes(changedAttr);
                                }}
                                renderInput = { (params) =>
                                    <TextField {...params} label="Category" variant="outlined" />
                                }
                            />
                        </div>
                        <div className="IP_row_item">
                            {/* Dropdown for the color scheme options */}
                            <Autocomplete
                                id = "colorPicker"
                                size = "small"
                                disableClearable
                                options = { this.props.colorSchemeOptions }
                                defaultValue = { this.props.colorSchemeOptions[0] }
                                getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let newScheme = this.props.attributes;
                                    newScheme.colorScheme = newInputValue.scheme;
                                    this.props.updateAttributes(newScheme);
                                }}
                                renderInput={(params) =>
                                    <TextField {...params} label="Color scheme" variant="outlined" />
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>;

        /**
         * Input panel implementation for the scatter plot matrix and parallel coordinates plot layout.
         * @type {JSX.Element}
         */
        PC_SPMInput = 
            <div>
                <div className="IP_column">
                    <div className="IP_item">
                        {/* dropdown for the selecting multiple numerical attributes */}
                        <Autocomplete
                            multiple
                            filterSelectedOptions
                            id = "SPMPC-attributes"
                            size = "small"
                            options = {this.props.attributeChoices.numerical}
                            getOptionLabel = { (option) => option.attr }
                            onChange=  { (event, newInputValue) => {
                                this.handleAttributeChange(newInputValue, 'pc_matrix')
                            }}
                            renderInput = { (params) =>
                                <TextField {...params} label="Attributes" variant="outlined" />
                            }
                        />
                    </div>
                    <div className="IP_item">
                        {/* Dropdown for the color scheme options */}
                        <Autocomplete
                            id = "SPMPC-Color"
                            size = "small"
                            options = { this.props.attributeChoices.categorical }
                            filterSelectedOptions
                            onChange = { (event, newInputValue) => {
                                let changedAttr = this.props.attributes;
                                changedAttr['color'] = newInputValue;
                                this.props.updateAttributes(changedAttr);
                            }}
                            renderInput = { (params) =>
                                <TextField {...params} label="Attribute for colors" variant="outlined"/>
                            }
                        />
                    </div>
                    <div className= "IP_row">
                        <div className="IP_row_item">
                            {/* categories dropdown */}
                            <Autocomplete
                                id = "category"
                                size = "small"
                                options = { keys }
                                // getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let changedAttr = this.props.attributes;
                                    changedAttr['category'] = newInputValue;
                                    this.props.updateAttributes(changedAttr);
                                }}
                                renderInput = { (params) =>
                                    <TextField {...params} label="Category" variant="outlined" />
                                }
                            />
                        </div>
                        <div className="IP_row_item">
                            {/* Dropdown for the color scheme options */}
                            <Autocomplete
                                id = "colorPicker"
                                size = "small"
                                disableClearable
                                options = { this.props.colorSchemeOptions }
                                defaultValue = { this.props.colorSchemeOptions[0] }
                                getOptionLabel = { (option) => option.name }
                                onChange = { (event, newInputValue) => {
                                    let newScheme = this.props.attributes;
                                    newScheme.colorScheme = newInputValue.scheme;
                                    this.props.updateAttributes(newScheme);
                                }}
                                renderInput={(params) =>
                                    <TextField {...params} label="Color scheme" variant="outlined" />
                                }
                            />
                        </div>
                    </div>

                </div>
            </div>;

        /**
         * Sliders implementation in input panel.
         * @type {*[]}
         */
        let selectedAttributes = this.getSelectedAttributes();
        sliders =       // The sliders for the chosen attributes.
            selectedAttributes.map(attribute =>
                <div key={attribute.attr}>
                    <div className= "SliderBlock">
                            { attribute.attr }
                            <Slider
                                value = { this.state.slider[attribute.attr] }
                                min = { attribute.min }
                                max = { attribute.max }
                                onChange = { (event, newValue) => {
                                    // update slider values on drag
                                    let value = this.state.slider;
                                    value[attribute.attr] = newValue;
                                    this.setState({slider: value});
                                }}
                                onChangeCommitted = { (event, newValue) => { // Only update attributes when slider is released
                                    let changedAttr = this.props.attributes;

                                    // After the slider is released, update the changed attribute min-max values
                                    if (Array.isArray(changedAttr[attribute.key])) {
                                        changedAttr[attribute.key][selectedAttributes.indexOf(attribute)].slider.min = newValue[0]
                                        changedAttr[attribute.key][selectedAttributes.indexOf(attribute)].slider.max = newValue[1]
                                    } else {
                                        changedAttr[attribute.key].slider.min = newValue[0]
                                        changedAttr[attribute.key].slider.max = newValue[1]
                                    }
                                    this.props.updateAttributes(changedAttr)
                                }}
                                valueLabelDisplay="auto"
                                aria-labelledby="range-slider"
                            />
                    </div>
                </div>
            );

        // Handles changes with interactions
        const handleInteractionChange = (event, interaction) => {
            this.props.updateSelectedInteraction(interaction);
        }

        // If at least two attributes are selected, then show the interaction technique buttons
        if (selectedAttributes.length >= 2) {
            SPInteractions =
                <div className= "interaction_buttons">
                    <div className= "interactions">
                        <ToggleButtonGroup  size="small"
                                            value={ this.props.selectedInteraction }
                                            aria-label="small outlined button group"
                                            onChange={ handleInteractionChange }
                                            exclusive>
                            <ToggleButton value = { this.props.interactionOptions[0] }>
                                <InfoIcon/>
                                { this.props.interactionOptions[0] }
                            </ToggleButton>
                            <ToggleButton value = { this.props.interactionOptions[1] }>
                                <BrushIcon/>
                                { this.props.interactionOptions[1] }
                            </ToggleButton>
                            <ToggleButton value = { this.props.interactionOptions[2] }>
                                <FullscreenIcon/>
                                { this.props.interactionOptions[2] }
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                </div>
            OtherInteractions =
            <div className= "interaction_buttons">
                <div className= "interactions">
                    <ToggleButtonGroup  size="small"
                                        value={ this.props.selectedInteraction }
                                        aria-label="small outlined button group"
                                        onChange={ handleInteractionChange }
                                        exclusive>
                        <ToggleButton value = { this.props.interactionOptions[0] }>
                            <InfoIcon/>
                            { this.props.interactionOptions[0] }
                        </ToggleButton>
                        <ToggleButton value = { this.props.interactionOptions[1] }>
                            <BrushIcon/>
                            { this.props.interactionOptions[1] }
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
            </div>
        }
        
        return(
            <div className= "Panel">
                { this.props.visualisation === "Scatterplot" ? SPInput : null }
                { this.props.visualisation === "Parallel Coordinate" ? PCInput : null }
                { this.props.visualisation === "Scatterplot Matrix" ? SPMatrixInput : null }
                { this.props.visualisation === "PC and SPM" ? PC_SPMInput : null }
                { this.props.visualisation !== "PC and SPM" && this.props.visualisation !== "Scatterplot Matrix"
                    ? sliders : null }
                { this.props.visualisation === "Scatterplot" ? SPInteractions : null }
                { this.props.visualisation !== "Scatterplot"? OtherInteractions : null}
            </div>
        )
    }
}

export default InputPanel;
