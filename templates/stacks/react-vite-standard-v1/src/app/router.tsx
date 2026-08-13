import { BrowserRouter, Routes, Route } from 'react-router'
import { HomePage } from '../pages/HomePage'

/**
 * Route table. Routes and their access levels are declared in design.md --
 * this file implements that table and should stay readable against it.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
