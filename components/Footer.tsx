interface Props {
    year: string;
}

const Footer: React.FunctionComponent<Props> = ({
    year,
}) => (
    <footer>
        <span>Copyright (C), Roland Jansen {year}</span>
    </footer>
)

export default Footer;