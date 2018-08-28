const
  Oyster = require(`./dist/index.js`).default,
  IOTA = require(`iota.lib.js`)

const iota = new IOTA({ provider: 'https://poll.oysternodes.com:14265/' })

const progress = new Oyster.UploadProgress(`coniccss1b19c83c8fbdc10476d6803e82217061e903197819353fd5885c8b29cf599e11V6b2AUBh`, {
  iotaProvider: iota
})

progress.on(`upload-progress`, console.log)
progress.on(`finish`, console.log)

// keep node instance open to recieve metadata
setInterval(() => {}, 1 << 30)
