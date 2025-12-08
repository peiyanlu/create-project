import { Layout } from 'antd'
import { Outlet } from 'react-router'
import { TestContext } from './context/testContext.ts'


const { Header, Footer, Sider, Content } = Layout


export const FullscreenLayout = () => <Outlet />

export const MainLayout = () => (
  <Layout style={ { height: '100vh' } }>
    <Sider>Side</Sider>
    
    <Layout>
      <Header>Header</Header>
      
      <Content>
        <TestContext value="Provider">
          <Outlet />
        </TestContext>
      </Content>
      
      <Footer>Footer 2021 ~ { new Date().getFullYear() }</Footer>
    </Layout>
  </Layout>
)
