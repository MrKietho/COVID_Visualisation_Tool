import React, {Component} from "react";
import "../styling/MainPanel.css";
import SP from "../visualisations/SP";
import PC from "../visualisations/PC";
import SPMatrix from "../visualisations/SPMatrix";
import SPM_PC from "../visualisations/SPM_PC";

/**
 * The class MainPanel handles the the main panel of the visualisation tool that shows the chosen layout.
 */
class MainPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 0,
            open: true
        };
    }

render() {

    return(
            <div>
                {/* If the SP layout is selected, check whether attributes are not null and return plot */}
                { this.props.visualisation === "Scatterplot" &&
                    this.props.attributes.x !== null && this.props.attributes.y !== null
                    ? <SP key={ this.props.attributes }
                        attributes={ this.props.attributes }
                        data = { this.props.data }
                        interaction = { this.props.interaction }
                    /> : null
                }

                {/* If the PC layout is selected, check whether good nr attributes is selected and return plot */}
                { this.props.visualisation === "Parallel Coordinate" &&
                    this.props.attributes.pc.length >= 2 && this.props.attributes.pc.length <= 6
                    ? <PC key={ this.props.attributes }
                          attributes={ this.props.attributes }
                          data = { this.props.data }
                          interaction = { this.props.interaction }
                    /> : null
                }

                {/* If the SPM layout is selected, check whether good nr attributes is selected and return plot  */}
                { this.props.visualisation === "Scatterplot Matrix" &&
                    this.props.attributes.matrix.length >= 2 && this.props.attributes.matrix.length <= 6
                    ? <SPMatrix key={ this.props.attributes }
                                attributes={ this.props.attributes }
                                data = { this.props.data }
                                interaction = { this.props.interaction }
                    /> : null
                }

                {/* If the PC and SPM layout is selected, check nr attributes and return plots */}
                { this.props.visualisation === "PC and SPM" &&
                    this.props.attributes.pc_matrix.length >= 2 && this.props.attributes.pc_matrix.length <= 6
                    ? <SPM_PC key={ this.props.attributes }
                              attributes={ this.props.attributes }
                              data = { this.props.data }
                              interaction = { this.props.interaction }
                    /> : null
                }
            </div>
        )
    }
}

export default MainPanel;
