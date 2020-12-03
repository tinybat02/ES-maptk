import { Frame, GeoJSON as IGeoJSON } from '../types';
import { Mesh, MeshPhongMaterial, DirectionalLight, AmbientLight } from 'three';
//@ts-ignore
import { GeoJSON, LineString, Polygon, VectorLayer } from 'maptalks';
//@ts-ignore
import { ThreeLayer } from 'maptalks.three';

const percentageToHsl = (percentage: number) => {
  const hue = percentage * -120 + 120;
  return 'hsla(' + hue + ', 100%, 50%, 1)';
};

export const createLayer = (series: Frame[], geojson: IGeoJSON) => {
  const stores: string[] = [];
  const assignValueToStore: { [key: string]: number } = {};
  const assignValueToStoreLog: { [key: string]: number } = {};

  series.map(item => {
    const sumValue = item.fields[0].values.buffer.reduce((sum, elm) => sum + elm, 0);
    if (item.name) {
      stores.push(item.name);
      assignValueToStore[item.name] = sumValue;
      assignValueToStoreLog[item.name] = Math.sqrt(sumValue);
    }
  });

  const heatValues = Object.values(assignValueToStoreLog);
  const max = Math.max(...heatValues);
  const min = Math.min(...heatValues);
  const range = max - min;

  const threeLayer = new ThreeLayer('t', {
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
  });

  const meshs: Mesh[] = [];

  threeLayer.prepareToDraw = function(gl: any, scene: any, camera: any) {
    const light = new DirectionalLight(0xffffff);
    light.position.set(0, -10, 10).normalize();
    scene.add(light);

    scene.add(new AmbientLight(0xffffff));

    geojson.features.map(feature => {
      if (feature.properties && feature.properties.name && stores.includes(feature.properties.name)) {
        const percentage = (assignValueToStoreLog[feature.properties.name] - min) / range;
        const material = new MeshPhongMaterial({
          color: range != 0 ? percentageToHsl(percentage) : 'hsla(49, 100%, 50%, 0.5)',
          transparent: true,
        });
        const polygon = GeoJSON.toGeometry(feature);
        let height = 10;
        if (percentage >= 0.4) height = 20;
        if (percentage >= 0.8) height = 30;
        polygon.setProperties({
          height: height,
          num: assignValueToStore[feature.properties.name],
          name: feature.properties.name,
        });
        const mesh = threeLayer.toExtrudePolygons(polygon, { topColor: '#fff' }, material);

        meshs.push(mesh);
        threeLayer.addMesh(meshs);

        mesh.setToolTip('tip', {
          showTimeout: 0,
          eventsPropagation: true,
          dx: 10,
        });

        mesh.on('mouseover', function(e: any) {
          const select = e.selectMesh;

          let data;
          if (select) {
            data = select.data;
          }
          const num = data.getProperties().num;
          const name = data.getProperties().name;
          //@ts-ignore
          const tooltip = this.getToolTip();
          tooltip._content = `${name} : ${num}`;
        });

        mesh.on('click', function(e: any) {
          const select = e.selectMesh;

          let data;
          if (select) {
            data = select.data;
          }
          const num = data.getProperties().num;
          const name = data.getProperties().name;
          //@ts-ignore
          const tooltip = this.getToolTip();
          tooltip._content = `${name} : ${num}`;
        });
      }
    });

    animation();
  };

  function animation() {
    threeLayer._needsUpdate = !threeLayer._needsUpdate;
    if (threeLayer._needsUpdate) {
      threeLayer.renderScene();
    }
    requestAnimationFrame(animation);
  }

  return threeLayer;
};

export const createLayerPure = (series: Frame[], geojson: IGeoJSON) => {
  const stores: string[] = [];
  const assignValueToStore: { [key: string]: number } = {};
  const assignValueToStoreLog: { [key: string]: number } = {};

  series.map(item => {
    const sumValue = item.fields[0].values.buffer.reduce((sum, elm) => sum + elm, 0);
    if (item.name) {
      stores.push(item.name);
      assignValueToStore[item.name] = sumValue;
      assignValueToStoreLog[item.name] = Math.log2(sumValue);
    }
  });

  const heatValues = Object.values(assignValueToStoreLog);
  const max = Math.max(...heatValues);
  const min = Math.min(...heatValues);
  const range = max - min;

  const buildings: (LineString | Polygon)[] = [];
  geojson.features.map(feature => {
    if (feature.properties && feature.properties.name && stores.includes(feature.properties.name)) {
      const percentage = (assignValueToStoreLog[feature.properties.name] - min) / range;
      const color = range != 0 ? percentageToHsl(percentage) : 'hsla(49, 100%, 50%, 0.5)';

      const polygon = new Polygon(feature.geometry.coordinates, {
        symbol: {
          lineColor: color,
          lineWidth: 0,
          polygonFill: color,
          polygonOpacity: 1,
          // textName: feature.properties.name,
          textSize: 14,
        },
        properties: {
          altitude: 10,
        },
      });

      const linecover = new LineString(feature.geometry.coordinates[0], {
        symbol: {
          lineColor: '#1bbc9b',
          lineWidth: 1,
          polygonFill: color,
          polygonOpacity: 1,
          // textName: 'polygon',
          // textPlacement: 'polygon',
          // textSize: 20,
        },
        properties: {
          altitude: 10,
        },
      });

      buildings.push(linecover);
      buildings.push(polygon);
    }
  });

  return new VectorLayer('vector', buildings, {
    enableAltitude: true,
    drawAltitude: {
      polygonFill: '#1bbc9b',
      polygonOpacity: 1,
      lineWidth: 1,
    },
  });
};
