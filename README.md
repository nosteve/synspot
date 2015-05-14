# synspot
Written for thotcon 0x6, synspot is a retro styled visualization of pcap traffic

## Getting started

- Install node.js
-- Latest version from http://nodejs.org recommended
- Clone synspot
```
git clone https://github.com/nosteve/synspot.git
```
- Install maxmind-geolite-mirror from https://www.npmjs.com/package/maxmind-geolite-mirror
```
npm install -g maxmind-geolite-mirror
mkdir -p /usr/local/share/GeoIP
/usr/local/bin/maxmind-geolite-mirror
```
- Install synspot node modules
```
cd synspot
npm install
```
- Process pcap file
```
node parse-pcap.js myfile.pcap
```
- Open index.html in a browser

