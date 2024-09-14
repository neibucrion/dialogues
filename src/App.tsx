import React from 'react';
import { useRete } from 'rete-react-plugin';
import logo from './logo.svg';
import './App.css';
import './rete.css';
import { createEditor } from './rete';
import { handleChange, sauveJson } from './gereJson';

function App() {
  const [ref] = useRete(createEditor)

  return (
    <div className="App">
      <header className="App-header">
        <input type="file" onChange={ handleChange }/>
        <button onClick={ sauveJson }>Sauver le JSON</button>
        <div ref={ref} className="rete"></div>
      </header>
    </div>
  );
}

export default App
