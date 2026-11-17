import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { InkDefs } from './components/ui/ink-defs'

function App() {
  return (
    <>
      <InkDefs />
      <RouterProvider router={router} />
    </>
  )
}

export default App
