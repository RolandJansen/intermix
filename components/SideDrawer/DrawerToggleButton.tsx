interface Props {
    click: () => any;
}

const drawerToggleButton: React.FunctionComponent<Props> = ({
    click,
}) => (
    <button className="toggle-button" onClick={click}>
        <div className="toggle-button__line" />
        <div className="toggle-button__line" />
        <div className="toggle-button__line" />
        <style jsx>{`
            .toggle-button {
                padding: 0;
                display: flex;
                flex-direction: column;
                justify-content: space-around;
                box-sizing: border-box;
                height: 24px;
                width: 30px;
                background: transparent;
                border: none;
                cursor: pointer;
            }
            .toggle-button:focus {
                outline: none;
            }
            .toggle-button__line {
                width: 26px;
                height: 2px;
                background: white;
            }
            /*
            @media (min-width: 769px) {
                .toggle-button {
                    display: none;
                }
            }
            */
        `}</style>
    </button>
);

export default drawerToggleButton;