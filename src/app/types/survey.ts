export interface SurveyDataRow {
  'Data No': number;
  'Dist From Start': number;
  'Station No': number;
  'On Voltage'?: number; //? (V)
  'Off Voltage'?: number; //? (V)
  'DCVG Voltage': number;
  'DCVG Voltage On': number;
  'DCVG Voltage Off': number;
  'Comment': string;
  'DCP/Feature/DCVG Anomaly': string;
  'On Time': string;
  'Off Time': string;
  'Latitude': number;
  'Longitude': number;
  'Altitude': number;
  'Fix Quality': string;
  'GPS Type'?: string; //?
  'Sats In Use': number;
  'PDOP': number;
  'HDOP': number;
  'VDOP': number;
  'Fix Time': string;
}

export interface DCPDataRow {
  'Data No': number;
  'Station No': number;
  'DCP/Feature/Anomaly': string;
  'Value1': number;
  'Value2': number;
  'Value3': number;
  'Comments': string;
  'On Time': string;
  'Off Time': string;
  'Latitude': number;
  'Longitude': number;
  'Altitude': number;
  'Fix Quality': string;
  'GPS Type'?: string; //?
  'Reading Text': string;
  'Device ID': string;
  'Sats In Use'?: number; //?
  'PDOP'?: number; //?
  'HDOP'?: number; //?
  'VDOP'?: number; //?
  'Fix Time'?: string; //?
}

export interface SurveyInfo {
  'Survey Type': string;
  'Rectifier Mode': string;
  'Cane Button Allowed To -- DCP': string;
  'Cane Button Allowed To - Survey': string;
  'Survey Walking Direction': string;
  'Use Metric': boolean;
  'Use Ohm*cm': boolean;
  'Mark DCVG Sidedrains in CIS Surveys': boolean;
  'Max. acceptable Far and Near Ground Reading Difference %': number;
  'AC System': string;
  'Maximum Acceptable Low Voltage': number;
  'GPS Type': string;
  'GPS Port': string; // ?
  'Use GPS Altitude': boolean;
  'Auto Log GPS at Flags': boolean;
  'Auto Log GPS at DCP/Feature': boolean;
  'Auto Log GPS at Sidedrain/Anomaly': boolean;
  'DCVG Defect Max mV = 1st read of Tot mV' : boolean; //?
  'Differential GPS Required' : boolean //?
  'Auto Log GPS Interval': string;
  'Max PDOP': number;
  'Submeter GPS Installed': boolean; //?
  'Use Submeter GPS': boolean; //?
  'CIS Flag Read Count %': number; //?
  'CIS Flag Error %': number;
  'Dist per reading': number;
  'Dist between Flags': number;
  'Name of P/L': string;
  'Current Station': string;
  'Survey Location': number;
  'Valve Segment': number;
  'Time To Walk Between Flags In Secs.': number;
  'Enable Auto Learn': boolean;
  'Auto Pace': boolean;
  'Number of Data Probes': string;
  'Location Style': string;
  'Work Order #': string;
  'Technician Name': string;
  'date / time': string;
  'Read Mode': string;
  'Range': string;
  'Moving Average Samples': number; //?
  'Rectifier Cycle On Time': number;
  'Rectifier Cycle Off Time': number;
  'GPS Sync On Read Delay': number;
  'GPS Sync Off Read Delay': number;
  'GPS Sync Downbeat': string;
  'GPS Sync Cycle Start = On->Off': boolean;
  'Use Custom GPS Coordinates': boolean;
  'Custom Coordinates Tranform Code': number;
  'Comments / Desc': string;
  'Notes'?: string;
  'SurveyName': string;
}

export interface Survey {
  surveyData: SurveyDataRow[];
  DCPData: DCPDataRow[];
  surveyInfo: SurveyInfo;
}

export interface SurveyFile {
  name: string;
  path: string;
  uploadedAt: string;
}

export const InfoSurveyNameKey = 'SurveyName';