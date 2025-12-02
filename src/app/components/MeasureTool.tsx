import React, { useEffect, useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L, { LatLng, Polyline, Popup } from "leaflet";
// import styles from './MeasureTool.module.css';

type MeasureToolProps = {
    isMeasuring: boolean;
};

const MeasureTool: React.FC<MeasureToolProps> = ({ isMeasuring }) => {
    const [startPoint, setStartPoint] = useState<LatLng | null>(null);
    const [lineLayer, setLineLayer] = useState<Polyline | null>(null);
    const [popupLayer, setPopupLayer] = useState<Popup | null>(null);

    const map = useMapEvents({
        click(e) {
            if (!isMeasuring) return;

            // First point
            if (!startPoint) {
                setStartPoint(e.latlng);
                return;
            }

            // Second point → measure & draw
            const endPoint = e.latlng;
            const meters = startPoint.distanceTo(endPoint);

            if (lineLayer) {
                lineLayer.remove();
            }
            const newLine = L.polyline([startPoint, endPoint]).addTo(map);
            setLineLayer(newLine);

            if (popupLayer) {
                popupLayer.remove();
            }
            const newPopup = L.popup()
                .setLatLng(endPoint)
                .setContent(`Distance: ${meters.toFixed(2)} meters`);
            newPopup.openOn(map);
            setPopupLayer(newPopup);
        },
    });

    // If measuring mode is turned off from outside, clear graphics
    useEffect(() => {
        if (!isMeasuring) {
            setStartPoint(null);
            if (lineLayer) {
                lineLayer.remove();
                setLineLayer(null);
            }
            if (popupLayer) {
                popupLayer.remove();
                setPopupLayer(null);
            }
        }
    }, [isMeasuring, lineLayer, popupLayer]);

    return null;
};

// --- Button control inside the map, next to zoom ---
type MeasureButtonControlProps = {
    isMeasuring: boolean;
    onClick: () => void;
};

const MeasureButtonControl: React.FC<MeasureButtonControlProps> = ({
                                                                       isMeasuring,
                                                                       onClick,
                                                                   }) => {
    const map = useMap();

    useEffect(() => {
        // eslint-disable-next-line
        // @ts-ignore
        const control = L.control({ position: "topleft" });

        control.onAdd = () => {
            const btn = L.DomUtil.create(
                "button",
                "leaflet-control-measure-btn"
            ) as HTMLButtonElement;

            btn.type = "button";
            btn.title = isMeasuring ? "Exit measure mode" : "Measure distance";
            btn.innerHTML = isMeasuring ? "✖" : "📏";

            L.DomEvent.disableClickPropagation(btn);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            L.DomEvent.on(btn, "click", (e: L.LeafletMouseEvent | any) => {
                e.preventDefault();
                onClick();
            });

            return btn;
        };

        control.addTo(map);
        return () => {
            control.remove();
        };
    }, [map, onClick, isMeasuring]);

    return null;
};

// --- Public component: drop this inside your <MapContainer> ---
export const MeasureDistanceControl: React.FC = () => {
    const [isMeasuring, setIsMeasuring] = useState(false);

    return (
        <>
            <MeasureButtonControl
                isMeasuring={isMeasuring}
                onClick={() => setIsMeasuring((prev) => !prev)}
            />
            <MeasureTool
                isMeasuring={isMeasuring}
            />
        </>
    );
};

export default MeasureDistanceControl;
