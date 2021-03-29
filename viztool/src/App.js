import React, {Component} from "react";
import './styling/App.css';
import VisualisationTool from "./pages/VisualisationTool";

/**
 * App renders the application and the main functionality.
 */
class App extends Component {

    render() {
        return(
            <div>

                <div className="Main">
                    <VisualisationTool/>
                </div>
            </div>
        );
    }
}

export default App;
