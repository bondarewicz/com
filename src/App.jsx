import Scene from './Scene.jsx'
import { GIT_SHA } from './version.js'

export default function App() {
  return (
    <div className="stage-root">
      <Scene />

      <div className="overlay tl">
        <span className="dot" />
        <span>bondarewicz.com</span>
      </div>
      <div className="overlay br">
        <span>{GIT_SHA}</span>
      </div>
    </div>
  )
}
