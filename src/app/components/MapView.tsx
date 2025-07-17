"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapView.module.css';
import L from 'leaflet';
import {useEffect, useMemo} from 'react';
import {MapDataPoint, MapInfo} from "@/app/types/report";

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

interface MapUpdaterProps {
  positions: [number, number][];
  extendedPositions: [number, number][];
}

interface MapViewProps {
  mapInfo: MapInfo;
  allMapsInfos?: MapInfo[];
}

const MapUpdater = ({ positions , extendedPositions}: MapUpdaterProps) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = new L.LatLngBounds(positions);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [positions, map]);

  return null;
};

const dataPointsToPositions = (data: MapDataPoint[]) => {
  return data
      .map((point) => point.location ? [point.location.latitude, point.location.longitude] : undefined)
      .filter((pos) => pos !== undefined) as [number, number][];
}

const MapView = ({ mapInfo, allMapsInfos }: MapViewProps) => {

  const positions: [number, number][] = useMemo(() => {
    return dataPointsToPositions(mapInfo.data);
  }, [mapInfo]);

  const extendedPositions: [number, number][] = useMemo(() => {
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

  return (
    <MapContainer
      center={[positions[0][0], positions[0][1]]}
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
      <Marker key={"start"} position={positions[0]} icon={getMarker("start")} />
      <Marker key={"end"} position={positions[positions.length - 1]} icon={getMarker("end")} />
      <Polyline positions={extendedPositions} color="lightblue" />
      <Polyline positions={positions} color="blue" />
      <MapUpdater positions={positions} extendedPositions={extendedPositions} />
    </MapContainer>
  );
};

export default MapView;
