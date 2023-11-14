import { MoralisNextApi } from '@moralisweb3/next';

const MORALIS_API_KEY = 'YOUR_API_KEY';
const NEXTAUTH_URL = 'http://localhost:3000';
export default MoralisNextApi({
  apiKey: MORALIS_API_KEY,
  authentication: {
    domain: NEXTAUTH_URL ? new URL(NEXTAUTH_URL).host : '',
    uri: 'http://localhost:3000',
    timeout: 120,
  },
});
