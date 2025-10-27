// Substitua todo o conteúdo de: src/App.jsx (Opção B - Corrigida)

import React, { useState } from "react";
import DarkVeil from "./DarkVeil";
import SpotlightCard from "./SpotlightCard";
import ReferentialOxy from "./ReferentialOxy";
import MapPage from "./MapPage";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [numBoxes, setNumBoxes] = useState("");
  const [boxValues, setBoxValues] = useState([]);
  const [error, setError] = useState("");
  const [calcLog, setCalcLog] = useState([]);
  const [bluePoint, setBluePoint] = useState(null);

  // --- FUNÇÕES COMPLETAS E CORRIGIDAS ---
  const handleNumChange = (e) => {
    const value = e.target.value;
    setNumBoxes(value);
    setError("");
    const num = parseInt(value);
    if (!value) {
      setBoxValues([]);
      return;
    }
    if (isNaN(num) || num < 1 || num > 26) {
      setError("It needs to be an integer from 1 to 26!");
      setBoxValues([]);
      return;
    }
    setBoxValues(Array(num).fill({ x: "", y: "", w: "" }));
  };

  const handleBoxChange = (index, axis, value) => {
    const newValues = [...boxValues];
    newValues[index] = { ...newValues[index], [axis]: value };
    setBoxValues(newValues);
  };

  const handleGenerate = async () => {
    setCalcLog([]);
    setBluePoint(null);
    try {
      const response = await fetch("http://127.0.0.1:5000/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: boxValues.map((p) => ({
            x: parseFloat(p.x) || 0,
            y: parseFloat(p.y) || 0,
            w: parseFloat(p.w) || 1,
          })),
        }),
      });
      const data = await response.json();
      setBluePoint(data.final_point);
      setCalcLog(data.logs);
    } catch (err) {
      console.error("Error calling backend:", err);
      setCalcLog(["Erro ao comunicar com o servidor"]);
    }
  };
  // --- FIM DAS FUNÇÕES CORRIGIDAS ---

  return (
    <div className="app-container">
      {/* MUDANÇA: hueShift ajustado para tons de verde/ciano */}
      <DarkVeil hueShift={160} />

      {page === "home" && (
        <div className="content">
          <div className="main-section">
            <SpotlightCard className="info-card">
              <div className="info-card-content">
                <h1 className="info-title">Simulador Método Gravítico</h1>
                <p className="info-sub">
                  Escolhe um modo para <strong>testar o nosso modelo</strong>.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="start-card">
              <div
                className="start-card-content"
                onClick={() => setPage("page2")}
              >
                <p>Start (Simulador)</p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="start-card">
              <div
                className="start-card-content"
                onClick={() => setPage("page3")}
              >
                <p>Start (com Mapa)</p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}
      {page === "page2" && (
        <div className="content page2">
          <div className="page2-container">
            <div className="calc-box">
              <h4>Calculation Steps</h4>
              <div className="calc-log">
                {calcLog.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
            <div className="graph-wrapper">
              <h2 className="graph-title">Referencial Oxy</h2>
              <div className="graph-section">
                <h3 className="y-axis-title">Eixo dos Y</h3>
                <h3 className="x-axis-title">Eixo dos X</h3>
                <ReferentialOxy
                  min={-15}
                  max={15}
                  points={boxValues}
                  bluePoint={bluePoint}
                />
              </div>
            </div>
            <div className="input-section">
              <p>Please write a number (1–26):</p>
              <input
                type="text"
                value={numBoxes}
                onChange={handleNumChange}
                placeholder="Enter number..."
              />
              {error && <p className="error-message">{error}</p>}
              {boxValues.map((val, idx) => (
                <div key={idx} className="dynamic-box">
                  <label>{String.fromCharCode(65 + idx)}:</label>
                  <span>(</span>
                  <input
                    className="coord-input"
                    type="text"
                    value={val.x}
                    onChange={(e) => handleBoxChange(idx, "x", e.target.value)}
                    placeholder="X"
                  />
                  <span> ; </span>
                  <input
                    className="coord-input"
                    type="text"
                    value={val.y}
                    onChange={(e) => handleBoxChange(idx, "y", e.target.value)}
                    placeholder="Y"
                  />
                  <span>)</span>
                  <input
                    className="coord-input weight-input"
                    type="text"
                    value={val.w}
                    onChange={(e) => handleBoxChange(idx, "w", e.target.value)}
                    placeholder="W"
                    title="Peso do cliente"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="buttons-wrapper">
            <SpotlightCard className="start-card">
              <div className="start-card-content" onClick={handleGenerate}>
                <p>Generate</p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="start-card">
              <div
                className="start-card-content"
                onClick={() => {
                  setPage("home");
                  setNumBoxes("");
                  setBoxValues([]);
                  setError("");
                  setCalcLog([]);
                  setBluePoint(null);
                }}
              >
                <p>Home</p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}
      {page === "page3" && (
        <div className="content">
          <MapPage onGoHome={() => setPage("home")} />
        </div>
      )}
    </div>
  );
}

export default App;