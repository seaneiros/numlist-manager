import { useWindowHeight }            from './lib/hooks';

import { Col, Grid, Row, Typography } from 'antd';
import * as AvailableItems            from './features/AvailableItems';
import * as SelectedItems             from './features/SelectedItems';


const MAX_TABLE_HEIGHT = 640;
const MIN_TABLE_HEIGHT = 260;

export const Layout = () => {
  const screens = Grid.useBreakpoint();
  const windowHeight = useWindowHeight();

  const reserved = screens.lg ? 300 : 340;
  const tableHeight = Math.max(MIN_TABLE_HEIGHT, Math.min(MAX_TABLE_HEIGHT, windowHeight - reserved));

  return (
    <main className="app">
      <header className="app-header">
        <Typography.Title level={3} style={{ margin: 0 }}>Sorter</Typography.Title>
        <Typography.Text type="secondary">
          Select items on the left, then drag them into order on the right.
        </Typography.Text>
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <AvailableItems.Filters />
          <Spacer />
          <AvailableItems.List height={tableHeight} />
        </Col>
        <Col xs={24} lg={12}>
          <SelectedItems.Filters />
          <Spacer />
          <SelectedItems.List height={tableHeight} />
        </Col>
      </Row>
    </main>
  );
}

const Spacer = () => <div style={{ marginBlockEnd: '1em' }} />;
