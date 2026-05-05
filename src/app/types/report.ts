export interface Coordinate {
  latitude?: number;
  longitude?: number;
  altitude?: number;
}

export interface StrengthPoint {
  station: number;
  vOn: number;
  vOff: number;
}

export type DCVGValueSource = 'SideDrain' | 'Calculated' ;

export interface DCVGValue {
  value: number;
  source: DCVGValueSource;
}

export interface Anomaly {
  station: number;
  dcvgValue: DCVGValue;
  coordinate?: Coordinate;
  strengthPoint1?: StrengthPoint;
  strengthPoint2?: StrengthPoint;
}

export interface AnomalyReport {
  anomalies: Anomaly[];
  strengthPoints: StrengthPoint[];
}

export interface DataPoint {
  distance: number; // X-axis: 'Dist From Start'
}
export interface GraphDataPoint extends DataPoint {
  onVoltage?: number; // Y-axis: 'On Voltage' (mV)
  offVoltage?: number; // Y-axis: 'Off Voltage' (mV)
  constantVoltage: number; // Y-axis: Constant -850mV
  dcvg?: number; // Y-axis: 'DCVG Voltage' (mV)
  comment?: string;
}

export interface MapDataPoint extends DataPoint {
  location?: Coordinate | "break";
}

export interface SegmentInfo {
  startDistance: number;
  endDistance: number;
  distanceDiff: number
}

export interface GraphInfo extends SegmentInfo {
  title: string;
  subtitle: string;
  data: GraphDataPoint[];

}

export interface MapInfo extends SegmentInfo {
  title: string;
  data: MapDataPoint[];
}