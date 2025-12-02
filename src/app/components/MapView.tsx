"use client";

import {MapContainer, TileLayer, Marker, Polyline, useMap, CircleMarker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapView.module.css';
import L from 'leaflet';
import {useEffect, useMemo} from 'react';
import {MapDataPoint, MapInfo} from "@/app/types/report";
import {useFocusDistance} from "@/app/hooks/useFocusDistance";
import {MeasureDistanceControl} from "@/app/components/MeasureTool";

// Fix for default icon issue with webpack
// delete (L.Icon.Default.prototype as any)._getIconUrl;

interface PositionInfo {
  position: [number, number];
  distance: number;
}

interface MapUpdaterProps {
  positions: [number, number][][];
}

interface MapViewProps {
  mapInfo: MapInfo;
  allMapsInfos?: MapInfo[];
  shouldFocus: boolean;
  showPointsMode?: boolean;
  mode?: "view" | "export";
  extendedMap?: boolean;
}

const MapUpdater = ({ positions }: MapUpdaterProps) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const flatPositions = positions.flat();
      const bounds = new L.LatLngBounds(flatPositions);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [positions, map]);

  return null;
};

function pathLengthKm(latlngs: L.LatLng[][]) {
  const distThreshold = 35; // meters
  let total = 0;
  for (let s=0; s < latlngs.length; s++) {
    for (let i = 1; i < latlngs[s].length; i++) {
      const dist = latlngs[s][i - 1].distanceTo(latlngs[s][i]); // meters
      if(dist < distThreshold) {
        total += dist;
      }
    }
  }
  return total / 1000; // km
}

const dataPointsToPositions = (data: MapDataPoint[]) : {positions: [number, number][][], positionsInfo: PositionInfo[][]} => {
  const positions: [number, number][][] = [];
  const positionsInfo: PositionInfo[][] = [];
  let currentLineSegment: [number, number][] = [];
  let currentLineSegmentInfo: PositionInfo[] = [];
  data.forEach((point) => {
    if (point.location === "break") {
      if (currentLineSegment.length > 0) {
        positions.push(currentLineSegment);
        positionsInfo.push(currentLineSegmentInfo);
        currentLineSegment = [];
        currentLineSegmentInfo = [];
      }
    } else if (point.location !== undefined && point.location.latitude !== undefined && point.location.longitude !== undefined) {
      currentLineSegment.push([point.location.latitude, point.location.longitude]);
      currentLineSegmentInfo.push({
        position: [point.location.latitude, point.location.longitude],
        distance: point.distance
      });
    } // else: ignore in case of undefined location
  });
  if (currentLineSegment.length > 0) {
    positions.push(currentLineSegment);
    positionsInfo.push(currentLineSegmentInfo);
  }
  return {positions, positionsInfo};
}

const MapView = ({ mapInfo, allMapsInfos , shouldFocus, showPointsMode = false, mode = "view", extendedMap = false}: MapViewProps) => {

  const { focusDistance } = useFocusDistance(shouldFocus);

  const focusDistancePosition : [number, number] | undefined = useMemo(() => {
    if (focusDistance === null || mapInfo.data.length === 0)
      return undefined;
    const focusLocation =  mapInfo.data.find((point) => point.distance === focusDistance)?.location;
    return (focusLocation && focusLocation !== "break" && focusLocation.latitude !== undefined && focusLocation.longitude !== undefined)
        ? [focusLocation.latitude, focusLocation.longitude]
        : undefined;
  }, [focusDistance, mapInfo]);

  const {positions, positionsInfo} = useMemo(() => {
    return dataPointsToPositions(mapInfo.data);
  }, [mapInfo]);

  const extendedPositions: [number, number][][] = useMemo(() => {
    const allData = allMapsInfos?.map((map) => map.data).flat() || [];
    return dataPointsToPositions(allData).positions;
  }, [allMapsInfos]);

  // TODO: move and display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const extendedPositionsKm = useMemo(() => {
    const segmentedAll = extendedPositions.map((s) => s.map((d) => L.latLng(d)));
    const flatAll = [segmentedAll.flat()];
    const km = pathLengthKm(segmentedAll);
    const kmFlat = pathLengthKm(flatAll);
    console.log("EX POS ", km);
    console.log("EX POS FLAT ", kmFlat);
    return km;
  }, [extendedPositions]);

  if (positions.length === 0 || positions[0].length === 0) {
    return <div>No location data available to display on the map.</div>;
  }

  const getMarker = (type: "start"| "end") => L.divIcon({
    iconSize: [8, 8],
    className: `${styles.markerCircle} ${type === "start" ? styles.startMarker : styles.endMarker}`,
  });

  const getFocusMarkerIcon = () => L.divIcon({
    iconSize: [12, 12],
    className: `${styles.markerCircle} ${styles.focusMarker}`,
  });

  const firstPosition = positions[0][0];
  const lastLineSegmentPositionIndex = positions[positions.length - 1].length-1;
  const lastPosition = positions[positions.length - 1][lastLineSegmentPositionIndex];

  const mapContainerClassName = [
    mode === "view" && styles.mapContainerView,
    mode === "export" && styles.mapContainerExport,
    mode === "export" && extendedMap && styles.extendedMapContainerExport,
  ].filter(Boolean).join(' ');

  return (
    <MapContainer
      center={[positions[0][0][0], positions[0][0][1]]}
      zoom={13}
      className={mapContainerClassName}
      zoomControl={mode === "view"}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      dragging={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker key={"start"} position={firstPosition} icon={getMarker("start")} />
      <Marker key={"end"} position={lastPosition} icon={getMarker("end")} />
      <Polyline positions={extendedPositions} color="lightblue" />
      <Polyline positions={positions} color="blue"/>
      {showPointsMode && <MeasureDistanceControl />}
      {showPointsMode && positions.map((segment, si) => (
          segment.map((point, pi) =>
            <CircleMarker
                key={`point_${si}_${pi}`}
                center={point}
                radius={2}
                color="white"
                fillColor="darkorange"
                weight={0}
                fillOpacity={0.8}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target.setStyle({
                      fillColor: "orange",
                      weight: 1,
                      radius: 4,
                    });
                  },
                  mouseout: (e) => {
                    e.target.setStyle({
                      fillColor: "darkorange",
                      radius: 2,
                      weight: 0,
                    });
                  },
                }}
            >
              <Popup minWidth={20}>
                <div>Distance: {positionsInfo[si][pi].distance}</div>
              </Popup>
            </CircleMarker>
          )
      ))}
      {focusDistancePosition && (
        <Marker
          key={'focus-point'}
          position={[focusDistancePosition[0], focusDistancePosition[1]]}
          icon={getFocusMarkerIcon()}
        />
      )}
      <MapUpdater positions={positions} />
    </MapContainer>
  );
};

export default MapView;
