import React, { createRef, useContext, useEffect, useRef, useState } from "react";
import SplitPaneContext from "./splitPaneContext";

const SplitPane = ({ children, ...props }) => {
    const [clientHeight, setClientHeight] = useState(null);
    const [clientWidth, setClientWidth] = useState(null);
    const yDividerPos = useRef(null);
    const xDividerPos = useRef(null);

    const onMouseHoldDown = (e) => {
        yDividerPos.current = e.clientY;
        xDividerPos.current = e.clientX;
        e.preventDefault();
    };

    const onMouseHoldUp = () => {
        yDividerPos.current = null;
        xDividerPos.current = null;
    };

    const onMouseHoldMove = (e) => {
        if (!yDividerPos.current && !xDividerPos.current) {
            return;
        }
        
        setClientHeight(clientHeight + e.clientY - yDividerPos.current);
        setClientWidth(e.clientX);
        
        yDividerPos.current = e.clientY;
        xDividerPos.current = e.clientX;
    };


    useEffect(() => {
        document.addEventListener("mouseup", onMouseHoldUp);
        document.addEventListener("mousemove", onMouseHoldMove);

        return () => {
            document.removeEventListener("mouseup", onMouseHoldUp);
            document.removeEventListener("mousemove", onMouseHoldMove);
        };
    });

    return (
        <div {...props}>
            <SplitPaneContext.Provider
                value={{
                    clientHeight,
                    setClientHeight,
                    clientWidth,
                    setClientWidth,
                    onMouseHoldDown,
                }} >
                {children}
            </SplitPaneContext.Provider>
        </div>
    );
};


export const Divider = (props) => {
    const { onMouseHoldDown } = useContext(SplitPaneContext);

    return <div {...props} className="separator-col d-flex align-items-center" onMouseDown={onMouseHoldDown} ><div className="vl"></div></div>;
};

export const SplitPaneLeft = (props) => {
    const topRef = createRef();
    const { clientWidth, setClientWidth } = useContext(SplitPaneContext);

    useEffect(() => {
        if (!clientWidth) {
            setClientWidth(topRef.current.clientWidth);
            return;
        }
        console.log(clientWidth);
        if (clientWidth< window.innerWidth - 200 || clientWidth<200) {
            topRef.current.style.minWidth = clientWidth + "px";
            topRef.current.style.maxWidth = clientWidth + "px";
        }

    }, [clientWidth]);


    return <div {...props} className={props.show?"split-pane-left":'d-none'} ref={topRef} />;
};

export const SplitPaneRight = (props) => {

    return (
        <div {...props} className="split-pane-right" />
    );
};

export default SplitPane;