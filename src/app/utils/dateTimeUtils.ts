import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const getNow = () => {
  return new Date().toISOString();
}

export const formatExcelDate = (excelSerial: string) => {
  if (Number.isNaN(Number(excelSerial))) return "";

  const excelEpoch = Date.UTC(1899, 11, 30);
  const jsDate = (Number(excelSerial) * 86400 * 1000) + excelEpoch;
  return dayjs.utc(jsDate).format("DD/MM/YYYY HH:mm:ss.SSS");

};