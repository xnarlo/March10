const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const portPath = process.env.SERIAL_PORT || "COM3";
const serialPort = new SerialPort({ path: portPath, baudRate: 115200 });
const parser = serialPort.pipe(new ReadlineParser());

module.exports = { serialPort, parser };
