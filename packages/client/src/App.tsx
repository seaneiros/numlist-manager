import {
  App as AntApp,
  ConfigProvider } from 'antd';
import { Layout }  from './Layout';


export function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#3456d1', borderRadius: 8 } }}>
      <AntApp>
        <Layout />
      </AntApp>
    </ConfigProvider>
  );
}