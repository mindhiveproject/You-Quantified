import React, { useEffect } from 'react';
import Sketch from 'react-p5';
import P5 from 'p5';


function P5Wrapper({sketch, params}) {
    const canvasRef = React.useRef();

    useEffect(() => {

        const Q = new P5(p => sketch(p, params, canvasRef), canvasRef.current);

        canvasRef.current.firstChild.style.visibility = "visible"
        function updateCanvasDimensions() {
            Q.createCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight);
            Q.redraw();
        }

        window.addEventListener("resize", updateCanvasDimensions, true);

        // Super important cleanup function
        return () => {
            Q.noLoop();
            Q.remove();
            window.removeEventListener("resize", updateCanvasDimensions, true);
        }
    }, []);

    return (
        <div className="h-100" ref={canvasRef} />
    ); 

}


const Head = ({value}) => {
     const Sketch = (p, value, canvasRef) => {

        p.setup = () => {
          p.createCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight, p.WEBGL);
          p.background(220);
          p.background(0, 20, 80);

        };

        p.draw = () => {
          p.background(40);
          //my box code:
          p.rotateX(value.current['Rotation']['x']);
          p.rotateY(value.current['Rotation']['y']);
          p.rotateZ(value.current['Rotation']['z']);
          p.box(100, 100, 100);
        };

    };

   return (
        <P5Wrapper sketch={Sketch} params={value}/>
    )
};

export default Head;