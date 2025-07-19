"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapView.module.css';
import L from 'leaflet';
import {useEffect, useMemo} from 'react';
import {MapDataPoint, MapInfo} from "@/app/types/report";

// Fix for default icon issue with webpack
// delete (L.Icon.Default.prototype as any)._getIconUrl;

interface MapUpdaterProps {
  positions: [number, number][][];
}

interface MapViewProps {
  mapInfo: MapInfo;
  allMapsInfos?: MapInfo[];
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

const dataPointsToPositions = (data: MapDataPoint[]) : [number, number][][] => {
  const positions: [number, number][][] = [];
  let currentLineSegment: [number, number][] = [];
  data.forEach((point) => {
    if (point.location === "break") {
      if (currentLineSegment.length > 0) {
        positions.push(currentLineSegment);
        currentLineSegment = [];
      }
    } else if (point.location !== undefined) {
      currentLineSegment.push([point.location.latitude, point.location.longitude]);
    } // else: ignore in case of undefined location
  });
  if (currentLineSegment.length > 0) {
    positions.push(currentLineSegment);
  }
  return positions;
}

const MapView = ({ mapInfo, allMapsInfos }: MapViewProps) => {

  const positions: [number, number][][] = useMemo(() => {
    return dataPointsToPositions(mapInfo.data);
  }, [mapInfo]);

  const extendedPositions: [number, number][][] = useMemo(() => {
    const allData = allMapsInfos?.map((map) => map.data).flat() || [];
    return dataPointsToPositions(allData);
  }, [allMapsInfos]);

  if (positions.length === 0) {
    return <div>No location data available to display on the map.</div>;
  }

  const getMarker = (type: "start"| "end") => L.divIcon({
    iconSize: [8, 8],
    className: `${styles.markerCircle} ${type === "start" ? styles.startMarker : styles.endMarker}`,
  });

  const firstPosition = positions[0][0];
  const lastLineSegmentPositionIndex = positions[positions.length - 1].length-1;
  const lastPosition = positions[positions.length - 1][lastLineSegmentPositionIndex];

  return (
    <MapContainer
      center={[positions[0][0][0], positions[0][0][1]]}
      zoom={13}
      className={styles.mapContainer}
      zoomControl
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
      <Polyline positions={positions} color="blue" />
      <MapUpdater positions={positions} />
    </MapContainer>
  );
};

export default MapView;
