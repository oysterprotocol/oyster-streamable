const Oyster = require('./dist/index.js').default

// new handle
// coniccss7154984d88bfba2c658aea4c2e96cd76dee8ac9fa5f1d7645e43a6f52df09c03FJKAQF1u
// test handle
// coniccssa7c75cec1a69e0b0638ed520648fa946dcba19818f89032ad5d6d315400bb4b7JT3oBK5j
// Arcdarkm543292c89d0b32b0895916dfe8cb25c77709a8805012ae916ef18ab995d1db28T8tTaHMc

const download = Oyster.Download.toBuffer(
  'Arcdarkm543292c89d0b32b0895916dfe8cb25c77709a8805012ae916ef18ab995d1db28T8tTaHMc',
  {
    iotaProviders: [
      { provider: 'https://poll.oysternodes.com:14265/' },
      { provider: 'http://18.217.133.146:14265' }
    ],
    autoStart: false
  }
)

download.on(`meta`, console.log)

// keep node instance open to recieve metadata
setInterval(() => {}, 1 << 30)