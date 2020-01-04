import Link from 'next/link';
import { NavItem } from "../interfaces";

interface Props {
    links: NavItem[];
    show: boolean;
}

const sideDrawer: React.FunctionComponent<Props> = ({
    links,
    show,
}) => {
    let drawerClasses = "side-drawer";
    if (show) {
        drawerClasses = "side-drawer open";
    }

    return (
        <nav className={drawerClasses}>
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
                    transform: translateX(-110%);
                    transition: transform 0.3s ease-in;
                }
                .side-drawer.open {
                    transform: translateX(0);
                    transition: transform 0.3s ease-out;
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
                @media (min-width: 769px) {
                    .side-drawer {
                        display: none;
                    }
                }
            `}</style>
        </nav>
    )
}

export default sideDrawer;