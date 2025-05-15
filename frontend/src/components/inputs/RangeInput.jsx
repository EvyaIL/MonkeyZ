import { useEffect, useState, useRef, useLayoutEffect } from "react";
import PointButton from "../buttons/PointButton";
import MovementWrapper from "../wrapper/MovementWrapper";
import PrimaryInput from "./PrimaryInput";

const RangeInput = ({ min, max, value, onChange }) => {
    const [range, setRange] = useState(value);
    const [containerWidth, setContainerWidth] = useState(1);
    const containerRef = useRef(null);
    const [rightPoint, setRightPoint] = useState({x:-1, y:-8})
    const [leftPoint, setLeftPoint] = useState({x:-1, y:-8})

    useLayoutEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        if (containerWidth > 1) {
            setLeftPoint({ x: scaleToPixels(range.min), y: -8 });
            setRightPoint({ x: scaleToPixels(range.max), y: -8 });
        }
    }, [containerWidth]);



    const scaleToPixels = (val) => ((val - min) / (max - min)) * containerWidth;
    const scaleToValue = (px) => Math.round((px / containerWidth) * (max - min) + min);

    const handleDrag = (side, newX) => {
        const newValue = scaleToValue(newX);
        setRange((prevRange) => {
            const updatedRange = { ...prevRange };

            if (side === "left") {
                updatedRange.min = Math.max(min, Math.min(newValue, prevRange.max - 1));
                setLeftPoint({x:newX, y:leftPoint.y})
            } else {
                updatedRange.max = Math.min(max, Math.max(newValue, prevRange.min + 1));
                setRightPoint({x:newX, y:rightPoint.y})
            }

            onChange(updatedRange);
            return updatedRange;
        });
    };

    return (
        <div className="flex flex-col w-full">
            <div ref={containerRef} className="relative w-full h-2 bg-gray-700 rounded-lg mt-2">
                <div
                    className="absolute h-2 bg-green-500 rounded-lg"
                    style={{
                        left: `${scaleToPixels(range.min)}px`,
                        width: `${scaleToPixels(range.max) - scaleToPixels(range.min)}px`,
                    }}
                />

                <MovementWrapper
                    item={{ x: leftPoint.x, y: leftPoint.y }}
                    setItem={(item) => handleDrag("left", item.x)}
                    boundaries={{ xMin: 0, xMax: scaleToPixels(range.max) - 10, yMin: 0, yMax: 0 }}
                >
                    <div className="w-10 h-10 flex justify-center items-center -translate-x-5 -translate-y-2">
                        <PointButton otherStyle="" current={true}/>
                    </div>                
                </MovementWrapper>

                <MovementWrapper
                    item={{ x: rightPoint.x, y: rightPoint.y }}
                    setItem={(item) => handleDrag("right", item.x)}
                    boundaries={{ xMin: scaleToPixels(range.min) + 10, xMax: containerWidth, yMin: 0, yMax: 0 }}
                >
                    <div className="w-10 h-10 flex justify-center items-center -translate-x-5 -translate-y-2">
                        <PointButton otherStyle="" current={true}/>
                    </div>   
                </MovementWrapper>
            </div>
                    
            <div className="flex justify-between items-center mt-2">
                <PrimaryInput  
                    min={min}
                    max={range.max - 1}
                    onChange={(e) => handleDrag("left", scaleToPixels(Number(e.target.value)))}
                    type="number" 
                    value={range.min}
                    otherStyle={"w-20 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"}
                />
                <span className="text-white mx-2">-</span>
                <PrimaryInput  
                    min={range.min + 1}
                    max={max}
                    onChange={(e) => handleDrag("right", scaleToPixels(Number(e.target.value)))}
                    type="number" 
                    value={range.max}
                    otherStyle={"w-20 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"}
                />
            </div>
        </div>
    );
};

export default RangeInput;
