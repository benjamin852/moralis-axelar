import { MoralisNextApi } from '@moralisweb3/next';

const MORALIS_API_KEY = 'JSubmrWUErdQR3QUTSztwNzpfO84QhKL6b5IFo5u9FzH2VsvBt4LEoQpsOqa56ZU';
const NEXTAUTH_URL = 'http://localhost:3000';
export default MoralisNextApi({
  apiKey: 'JSubmrWUErdQR3QUTSztwNzpfO84QhKL6b5IFo5u9FzH2VsvBt4LEoQpsOqa56ZU',
  authentication: {
    domain: NEXTAUTH_URL ? new URL(NEXTAUTH_URL).host : '',
    uri: 'http://localhost:3000',
    timeout: 120,
  },
});
