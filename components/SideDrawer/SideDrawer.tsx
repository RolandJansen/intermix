import Link from 'next/link';
import { NavItem } from "../interfaces";

interface Props {
    links: NavItem[];
}

const sideDrawer: React.FunctionComponent<Props> = ({
    links,
}) => (
        <nav className="side-drawer">
            <ul>
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
            <style jsx>{`
                .side-drawer {
                    z-index: 200;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 70%;
                    height: 100%;
                    max-width: 400px;
                    background: white;
                    box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.5);
                }
                .side-drawer ul {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    list-style: none;
                }
                .side-drawer li {
                    padding: 0.5rem 0;
                }
                .side-drawer a {
                    color: green;
                    text-decoration: none;
                    font-size: 1.2rem;
                }
                .side-drawer a:hover,
                .side-drawer a:active {
                    color: red;
                }

            `}</style>
        </nav>
    );

export default sideDrawer;