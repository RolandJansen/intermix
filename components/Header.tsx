import Link from 'next/link';
import { NavItem } from "./interfaces";

interface Props {
    title: string;
    links: NavItem[];
}

const Header: React.FunctionComponent<Props> = ({
    title,
    links,
}) => (
        <header>
            <span>
                <Link href="/">
                    <a>{title}</a>
                </Link>
            </span>
            <nav>
                {
                    links.map(link => (
                        <Link href={link.href}>
                            <a>{link.name}</a>
                        </Link>
                    ))
                }
            </nav>
        </header>
    )

export default Header;
