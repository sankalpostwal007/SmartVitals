import { BleManager } from 'react-native-ble-plx';
import { useEffect, useState, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { Buffer } from 'buffer';

// Nordic UART Service UUIDs
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export default function useBLE() {
  const manager = useRef(new BleManager()).current;

  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);

  // 🔥 This is what Dashboard will use
  const [deviceData, setDeviceData] = useState({
    hr: null,
    spo2: null,
    steps: 0,
    time: null,
  });

  const subscriptionRef = useRef(null);

  // 🟢 Scan
  const startScan = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }

    setDevices([]);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (device?.name) {
        setDevices(prev => {
          if (!prev.find(d => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
    }, 10000);
  };

  // 🟢 Connect
  const connectToDevice = async (device) => {
    try {
      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);

      startReadingData(connected);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  // 🟡 Monitor Data
  const startReadingData = (device) => {
    subscriptionRef.current = device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Monitor error:', error);
          return;
        }

        if (characteristic?.value) {
          const decoded = Buffer.from(
            characteristic.value,
            'base64'
          )
            .toString('utf8')
            .trim();

          const parsed = parseData(decoded);

          // Merge packet safely
          setDeviceData(prev => ({
            ...prev,
            ...parsed,
          }));
        }
      }
    );
  };

  // Parse JSON safely
  const parseData = (data) => {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  // 🟠 Disconnect
  const disconnectDevice = async () => {
    try {
      if (connectedDevice) {
        subscriptionRef.current?.remove();
        await manager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      manager.destroy();
    };
  }, []);

  return {
    devices,
    connectedDevice,
    deviceData,   // 🔥 Dashboard will use this
    startScan,
    connectToDevice,
    disconnectDevice,
  };
}