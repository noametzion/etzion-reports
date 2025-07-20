"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapView.module.css';
import L from 'leaflet';
import {useEffect, useMemo} from 'react';
import {MapDataPoint, MapInfo} from "@/app/types/report";
import {useFocusDistance} from "@/app/hooks/useFocusDistance";

// Fix for default icon issue with webpack
// delete (L.Icon.Default.prototype as any)._getIconUrl;

interface MapUpdaterProps {
  positions: [number, number][][];
}

interface MapViewProps {
  mapInfo: MapInfo;
  allMapsInfos?: MapInfo[];
  shouldFocus: boolean;
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

const dataPointsToPositions = (data: MapDataPoint[], ) : [number, number][][] => {
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

const MapView = ({ mapInfo, allMapsInfos , shouldFocus}: MapViewProps) => {

  const { focusDistance } = useFocusDistance(shouldFocus);

  const focusDistancePosition : [number, number] | undefined = useMemo(() => {
    if (focusDistance === null || mapInfo.data.length === 0)
      return undefined;
    const focusLocation =  mapInfo.data.find((point) => point.distance === focusDistance)?.location;
    return (focusLocation && focusLocation !== "break")
        ? [focusLocation.latitude, focusLocation.longitude]
        : undefined;
  }, [focusDistance, mapInfo]);

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

  const getFocusMarkerIcon = () => L.divIcon({
    iconSize: [12, 12],
    className: `${styles.markerCircle} ${styles.focusMarker}`,
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
