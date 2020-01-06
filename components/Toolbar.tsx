import React from 'react';
import { NavItem } from "./interfaces";
import MainNav from "./MainNav";
import SideDrawer from "./SideDrawer/SideDrawer";
import Backdrop from "./Backdrop";

interface Props {
    title: string;
    links: NavItem[];
}

interface ToolbarState {
    sideDrawerOpen: boolean;
}

class Toolbar extends React.Component<Props> {

    state: ToolbarState = {
        sideDrawerOpen: false,
    }

    drawerToggleClickHandler = () => {
        this.setState((previousState: ToolbarState) => {
            return {sideDrawerOpen: !previousState.sideDrawerOpen};
        });
    }

    backdropClickHandler = () => {
        this.setState({sideDrawerOpen: false});
    }

    render() {
        // let sideDrawer;
        let backdrop;

        if (this.state.sideDrawerOpen) {
            // sideDrawer = <SideDrawer links={this.props.links} show={this.state.sideDrawerOpen} />;
            backdrop = <Backdrop click={this.backdropClickHandler}/>;
        }

        return (
            <header className="toolbar">
                <MainNav
                    title={this.props.title}
                    links={this.props.links}
                    drawerClickHandler={this.drawerToggleClickHandler}
                />
                <SideDrawer links={this.props.links} show={this.state.sideDrawerOpen} />
                {backdrop}
                <style jsx>{`
                    .toolbar {
                        /*position: fixed;
                        top: 0;
                        left: 0;*/
                        width: 100%;
                        #background: #008080;
                        #background: #150080;
                        #background: #2A0080;
                        background: #003030;
                        height: 56px;
                    }
                `}</style>
            </header>
        )
    }
}

export default Toolbar;
