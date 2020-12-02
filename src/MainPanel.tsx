import React, { PureComponent } from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions, Frame } from 'types';
//@ts-ignore
import { Map, TileLayer, VectorLayer } from 'maptalks';
//@ts-ignore
import { ThreeLayer } from 'maptalks.three';
import { createLayer } from './util/process';
import { nanoid } from 'nanoid';
import 'maptalks/dist/maptalks.css';

interface Props extends PanelProps<PanelOptions> {}
interface State {}

export class MainPanel extends PureComponent<Props, State> {
  id = 'id' + nanoid();
  map: Map;
  threeLayer: VectorLayer;

  componentDidMount() {
    const { center_lat, center_lon, zoom_level } = this.props.options;
    this.map = new Map(this.id, {
      center: [center_lon, center_lat],
      zoom: zoom_level,
      pitch: 56,
      bearing: 60,
      baseLayer: new TileLayer('base', {
        urlTemplate: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      }),
      touchGesture: true,
    });

    if (!this.props.options.geojson) return;

    if (this.props.data.series.length > 0) {
      this.threeLayer = createLayer(this.props.data.series as Frame[], this.props.options.geojson);
      this.map.addLayer(this.threeLayer);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.data.series !== this.props.data.series) {
      if (!this.props.options.geojson) return;
      this.map.removeLayer(this.threeLayer);
      if (this.props.data.series.length > 0) {
        this.threeLayer = createLayer(this.props.data.series as Frame[], this.props.options.geojson);
        this.map.addLayer(this.threeLayer);
      }
    }
  }

  render() {
    const { width, height } = this.props;

    return (
      <div
        id={this.id}
        style={{
          width,
          height,
        }}
      />
    );
  }
}
