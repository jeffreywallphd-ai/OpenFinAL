const { IPC_CHANNELS } = require('./channels');
const { invokeContract, ipcContracts, registerHandle, registerListener, sendContract } = require('./contracts');

module.exports = {
  IPC_CHANNELS,
  invokeContract,
  ipcContracts,
  registerHandle,
  registerListener,
  sendContract,
};
