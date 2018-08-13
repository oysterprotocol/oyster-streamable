import { EventEmitter } from "events";

export default class UploadProgress extends EventEmitter {
  constructor(handle) {
    super();


  }

  static streamUploadProgress(handle) {
    console.log('Check upload progress on :', handle)
  }
}