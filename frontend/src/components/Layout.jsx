import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useLang } from '../utils/lang'

function Layout({ children, titleKey }) {
  const { dir } = useLang()

  return (
    <div dir={dir} className="min-h-screen" style={{ backgroundColor: '#f5f4f0' }}>
      <Sidebar />
      <TopBar titleKey={titleKey} />
      <main className="pt-14" style={{ marginLeft: '220px', marginRight: 0 }}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default Layout
