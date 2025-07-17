export interface GraphDataPoint {
  distance: number; // X-axis: 'Dist From Start'
  onVoltage?: number; // Y-axis: 'On Voltage' (mV)
  offVoltage?: number; // Y-axis: 'Off Voltage' (mV)
  constantVoltage: number; // Y-axis: Constant -850mV
  dcvg?: number; // Y-axis: 'DCVG Voltage' (mV)
}

export interface MapDataPoint {
  distance: number; // X-axis: 'Dist From Start'
  location?: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
}

export interface GraphInfo {
  title: string;
  data: GraphDataPoint[];
}

export interface MapInfo {
  title: string;
  data: MapDataPoint[];
}