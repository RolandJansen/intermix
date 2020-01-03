import Link from 'next/link';
import { NavItem } from "./interfaces";
import DrawerToggleButton from './SideDrawer/DrawerToggleButton';

interface Props {
    title: string;
    links: NavItem[];
}

const Header: React.FunctionComponent<Props> = ({
    title,
    links,
}) => (
        <header className="toolbar">
            <nav className="main-nav">
                <div className="main-nav__drawerbutton">
                    <DrawerToggleButton />
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
                            <li>
                                <Link href={link.href}>
                                    <a>{link.name}</a>
                                </Link>
                            </li>
                        ))
                    }
                </ul>
            </nav>
            <style jsx>{`
                .toolbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    #background: #008080;
                    #background: #150080;
                    #background: #2A0080;
                    background: #003030;
                    height: 56px;
                }
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
                    flex: 1;
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
            `}</style>
        </header>
    )

export default Header;
