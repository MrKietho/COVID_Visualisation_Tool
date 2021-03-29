import React, {Component} from "react";
import "../styling/NavigationBar.css";
import "../MyLogo.png";

/**
 * adds the navigation bar that is clickable.
 */
class NavigationBar extends Component{

    render() {
        return (
            <div className="NavigationBar">
                <div className="NavItemRight" onClick = { () => { window.location.href = "/" } }>
                    <div className="NavItemRight">Ynteractive</div>
                    <div className="Logo"/>
                </div>

                <div className="NavItem" onClick = { () => { window.location.href = "/" } }>Homepage</div>
                <div className="NavItem" onClick = { () => { window.location.href = "/visualisations" } }><p>Visualisation Tool</p></div>
                <div className="NavItem" onClick = { () => { window.location.href = "/about" } }><p>About</p></div>
            </div>
        );
    }
}

export default NavigationBar;
