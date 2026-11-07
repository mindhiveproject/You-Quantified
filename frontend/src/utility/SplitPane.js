import React, { createRef, useContext, useEffect, useRef, useState } from "react";
import SplitPaneContext from "./splitPaneContext";

const SplitPane = ({ children, ...props }) => {
    const [clientHeight, setClientHeight] = useState(null);
    const [clientWidth, setClientWidth] = useState(null);
    const isDragging = useRef(false);
    const yDividerPos = useRef(null);
    const xDividerPos = useRef(null);
    const ref = useRef(null);

    const onMouseHoldDown = (e) => {
        isDragging.current = true;
        yDividerPos.current = e.clientY;
        xDividerPos.current = e.clientX;
        // Capture the pointer so we keep getting move/up events even while the
        // cursor is over the visuals iframe, which would otherwise swallow them
        // and leave the divider stuck to the cursor.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        e.preventDefault();
    };

    const onMouseHoldUp = () => {
        isDragging.current = false;
        yDividerPos.current = null;
        xDividerPos.current = null;
    };

    const onMouseHoldMove = (e) => {
        if (!isDragging.current) {
            return;
        }

        setClientHeight(clientHeight + e.clientY - yDividerPos.current);
        // Measured from the pane's own edge, which a side bar can push in.
        setClientWidth(e.clientX - ref.current.getBoundingClientRect().left);
        
        yDividerPos.current = e.clientY;
        xDividerPos.current = e.clientX;
    };


    useEffect(() => {
        document.addEventListener("pointerup", onMouseHoldUp);
        document.addEventListener("pointercancel", onMouseHoldUp);
        document.addEventListener("pointermove", onMouseHoldMove);

        return () => {
            document.removeEventListener("pointerup", onMouseHoldUp);
            document.removeEventListener("pointercancel", onMouseHoldUp);
            document.removeEventListener("pointermove", onMouseHoldMove);
        };
    });

    return (
        <div {...props} ref={ref}>
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

    return <div {...props} className="separator-col d-flex align-items-center" onPointerDown={onMouseHoldDown} ><div className="vl"></div></div>;
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