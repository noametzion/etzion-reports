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
  location?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  } | "break";
}

export interface SegmentInfo {
  startDistance: number;
  endDistance: number;
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