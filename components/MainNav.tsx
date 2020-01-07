import Link from "next/link";
import { NavItem } from "./interfaces";
import DrawerToggleButton from './SideDrawer/DrawerToggleButton';
import { loadGetInitialProps } from "next/dist/next-server/lib/utils";

interface Props {
    title: string;
    links: NavItem[];
    drawerClickHandler: () => any;
}

const mainNav: React.FunctionComponent<Props> = ({
    title,
    links,
    drawerClickHandler,
}) => (
        <nav className="main-nav">
            <div className="main-nav__drawerbutton">
                <DrawerToggleButton click={drawerClickHandler} />
            </div>
            <div className="main-nav__logo">
                <Link href="/">
                    <a>{title}</a>
                </Link>
            </div>
            <div className="main-nav__spacer" />
            <ul className="main-nav__links">
                {
                    links.map(link => (
                        <li key={link.href}>
                            <Link href={link.href}>
                                <a>{link.name}</a>
                            </Link>
                        </li>
                    ))
                }
            </ul>
            <style jsx>{`
                .main-nav {
                    display: flex;
                    height: 100%;
                    align-items: center;
                    padding: 0 1rem;
                }
                .main-nav__drawerbutton {
                    padding-right: 1rem;
                }
                .main-nav__logo a {
                    color: white;
                    text-decoration: none;
                    font-size: 1.5rem;
                }
                .main-nav__spacer {
                    flex: 1; /* consumes all unused space */
                }
                .main-nav__links {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    display: flex;
                }
                .main-nav__links li {
                    padding: 0 0.5rem;
                }
                .main-nav__links a {
                    color: white;
                    text-decoration: none;
                }
                .main-nav__links a:hover,
                .main-nav__links a:active {
                    color: #D0D050;
                }
                @media (max-width: 768px) {
                    .main-nav__links {
                        display: none;
                    }
                }
                @media (min-width: 769px) {
                    .main-nav__drawerbutton {
                        display: none;
                    }
                }
            `}</style>
        </nav>
    );

export default mainNav;