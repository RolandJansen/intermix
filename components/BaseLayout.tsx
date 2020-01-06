import { NavItem } from "./interfaces";
import Toolbar from "./Toolbar";
import Footer from "./Footer";

interface Props {
    title?: string;
}

const sections: NavItem[] = [
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
    <div className="container">
        <Toolbar title={title} links={sections} />
        <main>
            { children }
        </main>
        <Footer title={title} sections={sections} year={fullYear.toString()}/>
        <style jsx global>{`
            html {
                height: 100%;
                background: #1e1e1e;
            }
            body {
                height: 100%;
                margin: 0;
                padding: 0;
                background: white;
                font-family: sans-serif;
            }
            /* __next is a div added by next.js that holds the content
               so we have to style it to full height. */
            #__next {
                height: 100%;
            }
            .container {
                height: 100%;
                display: flex;
                flex-flow: column wrap;
                /*align-items: space-between;*/
            }
            Toolbar {
            }
            main {
                flex: 1 0 auto;
                padding: 0 1rem;
                background: white;
                /*height: 100%;*/
            }
            Footer {
            }
        `}</style>
    </div>
)

export default BaseLayout;
