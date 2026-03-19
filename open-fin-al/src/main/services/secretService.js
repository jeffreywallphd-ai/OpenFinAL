const OPEN_FINAL_SECRET_SERVICE = 'OpenFinAL';

function createSecretService({ keytar, logger = console }) {
  async function getSecret(key) {
    try {
      return await keytar.getPassword(OPEN_FINAL_SECRET_SERVICE, key);
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  async function setSecret(key, secret) {
    try {
      await keytar.setPassword(OPEN_FINAL_SECRET_SERVICE, key, secret);
      return true;
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  return {
    getSecret,
    setSecret,
  };
}

module.exports = {
  OPEN_FINAL_SECRET_SERVICE,
  createSecretService,
};
