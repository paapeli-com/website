// Shared option data for the Create Device / Create Gateway forms.
// Kept as plain data so the forms, list and settings views stay in sync.

export interface OrgUser {
  id: string;
  name: string;
  email: string;
}

// Mirrors the mock members used on the Members page so "Share with users" is consistent.
export const ORG_USERS: OrgUser[] = [
  { id: "m-1", name: "Armin Rajabi", email: "armin.rajabi@company.com" },
  { id: "m-2", name: "محمدعرفان شمس", email: "erfan.shams@company.com" },
  { id: "m-3", name: "Mehdi Hoseini", email: "mehdi.hoseini@company.com" },
  { id: "m-4a", name: "حامد فضایلی", email: "hamed.fazaeli@company.com" },
  { id: "m-5", name: "Fatemeh Hosseini", email: "fatemeh.hosseini@company.com" },
  { id: "m-6", name: "امیرکیان عدل", email: "amirkian.adl@company.com" },
  { id: "m-7", name: "Peyman Karimi", email: "peyman.karimi@company.com" },
  { id: "m-8", name: "علیرضا طاهری‌نژاد", email: "alireza.taheri@company.com" },
];

export const userById = (id: string) => ORG_USERS.find((u) => u.id === id);

// ---- Popular sensors (Device form only) ----
export type SensorCategory = "environment" | "electrical" | "mechanical" | "flow" | "other";

export interface PopularSensor {
  id: string;
  name: string;
  descKey: string;        // translation key for the short description
  category: SensorCategory;
  protocol: string;       // default protocol applied when picked
}

export const SENSOR_CATEGORIES: SensorCategory[] = ["environment", "electrical", "mechanical", "flow", "other"];

export const POPULAR_SENSORS: PopularSensor[] = [
  { id: "dht11", name: "DHT11", descKey: "sensorTempHumidity", category: "environment", protocol: "MQTT" },
  { id: "temperature", name: "Temperature", descKey: "sensorMeasureTemperature", category: "environment", protocol: "MQTT" },
  { id: "humidity", name: "Humidity", descKey: "sensorMeasureHumidity", category: "environment", protocol: "MQTT" },
  { id: "co2", name: "CO₂", descKey: "sensorMeasureCo2", category: "environment", protocol: "MQTT" },
  { id: "air-quality", name: "Air Quality", descKey: "sensorMeasureAirQuality", category: "environment", protocol: "MQTT" },
  { id: "pressure", name: "Pressure", descKey: "sensorMeasurePressure", category: "mechanical", protocol: "Modbus TCP" },
  { id: "vibration", name: "Vibration", descKey: "sensorMeasureVibration", category: "mechanical", protocol: "OPC-UA" },
  { id: "proximity", name: "Proximity", descKey: "sensorMeasureProximity", category: "mechanical", protocol: "Modbus TCP" },
  { id: "level", name: "Level", descKey: "sensorMeasureLevel", category: "mechanical", protocol: "Modbus TCP" },
  { id: "voltage", name: "Voltage", descKey: "sensorMeasureVoltage", category: "electrical", protocol: "Modbus TCP" },
  { id: "current", name: "Current", descKey: "sensorMeasureCurrent", category: "electrical", protocol: "Modbus TCP" },
  { id: "power", name: "Power Meter", descKey: "sensorMeasurePower", category: "electrical", protocol: "Modbus TCP" },
  { id: "energy", name: "Energy Meter", descKey: "sensorMeasureEnergy", category: "electrical", protocol: "Modbus TCP" },
  { id: "flow", name: "Flow Meter", descKey: "sensorMeasureFlow", category: "flow", protocol: "Modbus TCP" },
  { id: "water-flow", name: "Water Flow", descKey: "sensorMeasureWaterFlow", category: "flow", protocol: "MQTT" },
  { id: "gas-flow", name: "Gas Flow", descKey: "sensorMeasureGasFlow", category: "flow", protocol: "Modbus TCP" },
  { id: "ph", name: "pH Sensor", descKey: "sensorMeasurePh", category: "other", protocol: "MQTT" },
  { id: "gps", name: "GPS Tracker", descKey: "sensorMeasureGps", category: "other", protocol: "MQTT" },
  { id: "rfid", name: "RFID Reader", descKey: "sensorMeasureRfid", category: "other", protocol: "HTTP" },
  { id: "light", name: "Light Sensor", descKey: "sensorMeasureLight", category: "environment", protocol: "MQTT" },
  { id: "motion", name: "Motion (PIR)", descKey: "sensorMeasureMotion", category: "other", protocol: "MQTT" },
  { id: "sound", name: "Sound Level", descKey: "sensorMeasureSound", category: "other", protocol: "MQTT" },
];

// ---- Templates ----
export interface FormTemplate {
  id: string;
  name: string;          // translation key for the title
  descKey: string;       // translation key for the description
  icon: string;          // lucide icon name resolved by the form
}

export const DEVICE_TEMPLATES: FormTemplate[] = [
  { id: "gateway", name: "tplGateway", descKey: "tplGatewayDesc", icon: "Router" },
  { id: "single-sensor", name: "tplSingleSensor", descKey: "tplSingleSensorDesc", icon: "Thermometer" },
  { id: "multi-sensor", name: "tplMultiSensor", descKey: "tplMultiSensorDesc", icon: "LayoutGrid" },
  { id: "plc", name: "tplPlc", descKey: "tplPlcDesc", icon: "Cpu" },
  { id: "machine", name: "tplMachine", descKey: "tplMachineDesc", icon: "Factory" },
  { id: "edge", name: "tplEdge", descKey: "tplEdgeDesc", icon: "Server" },
];

export const GATEWAY_TEMPLATES: FormTemplate[] = [
  { id: "edge", name: "gwTplEdge", descKey: "gwTplEdgeDesc", icon: "Router" },
  { id: "protocol-bridge", name: "gwTplBridge", descKey: "gwTplBridgeDesc", icon: "Network" },
  { id: "software", name: "gwTplSoftware", descKey: "gwTplSoftwareDesc", icon: "Server" },
  { id: "ha", name: "gwTplHa", descKey: "gwTplHaDesc", icon: "ShieldCheck" },
  { id: "plc-gateway", name: "gwTplPlc", descKey: "gwTplPlcDesc", icon: "Cpu" },
];

// ---- Security / credentials ----
export type AuthMethod = "accessToken" | "basic" | "ssl";

export const AUTH_METHODS: AuthMethod[] = ["accessToken", "basic", "ssl"];

export const generateAccessToken = () =>
  Array.from({ length: 20 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]).join("");
