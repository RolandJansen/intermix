import { NavItem } from "./interfaces";
import Toolbar from "./Toolbar";
import Footer from "./Footer";

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
    <div>
        <Toolbar title={title} links={pages} />
        <main>
            {children}
        </main>
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
                /* height: 100%; */
            }
        `}</style>
    </div>
)

export default BaseLayout;
