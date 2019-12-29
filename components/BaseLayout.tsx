import Header from "./Header";
import { NavItem } from "./interfaces";
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
        <Header title={title} links={pages} />
        {children}
        <Footer  year={fullYear.toString()}/>
    </div>
)

export default BaseLayout;
