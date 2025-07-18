import { useEffect, useRef, useState } from 'react';

const owner = 'PRIME8s';
const repo = 'prime8s-closet';
const basePath = 'assets';
const baseURL = `https://raw.githubusercontent.com/${owner}/${repo}/main/${basePath}`;

const layerOrder = ['background', 'fur', 'clothes', 'hat', 'eyes', 'mouth'];

export default function LayerEditor({ onExport }) {
  const canvasRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [selected, setSelected] = useState({});

  const fetchLayerFiles = async () => {
    const result = {};
    for (const layer of layerOrder) {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}/${layer}`
      );
      if (!res.ok) {
        console.error(`Failed to fetch ${layer}:`, res.status);
        result[layer] = [];
        continue;
      }
      const data = await res.json();
      result[layer] = data
        .filter((item) => item.name.match(/\.(png|jpg|jpeg)$/i))
        .map((item) => item.name);
    }
    setLayers(result);
    const init = {};
    for (const layer of layerOrder) {
      init[layer] = result[layer]?.[0] || '';
    }
    setSelected(init);
  };

  useEffect(() => {
    fetchLayerFiles();
  }, []);

  const drawCanvas = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const layer of layerOrder) {
      const filename = selected[layer];
      if (!filename) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${baseURL}/${layer}/${filename}`;
      await new Promise((res) => (img.onload = res));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (Object.keys(selected).length) {
      drawCanvas();
    }
  }, [selected, layers]);

  const exportPNG = () => {
    const dataURL = canvasRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'prime8_composite.png';
    link.href = dataURL;
    link.click();
    if (onExport) onExport(selected, dataURL);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Prime8s NFT Layer Generator</h1>
      <canvas ref={canvasRef} width={500} height={500} style={{ border: '1px solid black' }} />
      {layerOrder.map((layer) => (
        <div key={layer} style={{ marginTop: 10 }}>
          <label style={{ marginRight: 10 }}>{layer.toUpperCase()}:</label>
          <select
            value={selected[layer] || ''}
            onChange={(e) =>
              setSelected((prev) => ({ ...prev, [layer]: e.target.value }))
            }
          >
            {layers[layer]?.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            )) || <option>Loading...</option>}
          </select>
        </div>
      ))}
      <button onClick={exportPNG} style={{ marginTop: 20 }}>
        Export as PNG
      </button>
    </div>
  );
}
