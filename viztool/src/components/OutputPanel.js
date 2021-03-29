import React, {Component} from "react";
import "../styling/SidePanel.css";


class OutputPanel extends Component {
    render() {
        return(
            <div className= "OutputPanel">
                <div className= "bold"><p>Output panel</p></div>
                <div id="output"/>
                <div id="selectedOutput"/>
            </div>
        )
    }
}

export default OutputPanel;
