import { NavItem } from "./interfaces";
import Header from "./Header";
import Footer from "./Footer";
import SideDrawer from "./SideDrawer/SideDrawer";
import Backdrop from "./Backdrop";

interface Props {
    title?: string;
}

const pages: NavItem[] = [
    {
        name: "Getting Started",
        href: "/getting_started",
    },
    {
        name: "API",
        href: "/api",
    }
];

const fullYear = new Date().getFullYear();

const BaseLayout: React.FunctionComponent<Props> = ({
    children,
    title = "intermix",
}) => (
    <main>
        <Header title={title} links={pages} />
        {/*
        <SideDrawer links={pages} />
        <Backdrop />

        */}
        {children}
        <Footer  year={fullYear.toString()}/>
        <style jsx global>{`
            html {
                background: #1e1e1e;
            }
            body {
                height: 100%;
                margin: 0;
                padding: 0;
                background: white;
                font-family: sans-serif;
            }
            main {
                height: 100%;
            }
        `}</style>
    </main>
)

export default BaseLayout;
