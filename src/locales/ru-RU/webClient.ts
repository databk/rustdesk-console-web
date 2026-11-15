import connection from './webClient/connection';
import fileTransfer from './webClient/fileTransfer';
import communication from './webClient/communication';
import sessionSettings from './webClient/sessionSettings';

export default {
  ...connection,
  ...fileTransfer,
  ...communication,
  ...sessionSettings,
};
