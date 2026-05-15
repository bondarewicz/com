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
        <a
          className="sha-link"
          href={`https://github.com/bondarewicz/com/commit/${GIT_SHA}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {GIT_SHA}
        </a>
      </div>
    </div>
  )
}
