import React, { PureComponent } from 'react';
import { PanelProps } from '@grafana/data';
import { PanelOptions, Frame, CSVRow } from 'types';
//@ts-ignore
import { Map, TileLayer, VectorLayer } from 'maptalks';
//@ts-ignore
import { ThreeLayer } from 'maptalks.three';
import { createLayer } from './util/process';
import { nanoid } from 'nanoid';
import useCsvDownloader from 'use-csv-downloader';
import Icon from './img/save_icon.svg';
import 'maptalks/dist/maptalks.css';
import './css/main.css';

interface Props extends PanelProps<PanelOptions> {}
interface State {
  csvData: Array<CSVRow>;
}

export class MainPanel extends PureComponent<Props, State> {
  id = 'id' + nanoid();
  map: Map;
  threeLayer: VectorLayer;

  state: State = { csvData: [] };

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
      doubleClickZoom: false,
      scrollWheelZoom: false,
    });

    if (!this.props.options.geojson) return;

    if (this.props.data.series.length > 0) {
      const { threeLayer, csvData } = createLayer(this.props.data.series as Frame[], this.props.options.geojson);
      this.threeLayer = threeLayer;
      this.setState({ csvData });
      this.map.addLayer(this.threeLayer);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.data.series !== this.props.data.series) {
      if (!this.props.options.geojson) return;
      this.map.removeLayer(this.threeLayer);
      const series = this.props.data.series as Frame[];
      if (series.length == 0) {
        this.setState({ csvData: [] });
        return;
      }
      const { threeLayer, csvData } = createLayer(series, this.props.options.geojson);
      this.threeLayer = threeLayer;
      this.setState({ csvData });
      this.map.addLayer(this.threeLayer);
    }
  }

  onDownload = () => {
    const { filename } = this.props.options;
    const downloadCsv = useCsvDownloader({ quote: '', delimiter: ';' });
    downloadCsv(this.state.csvData, `${filename}.csv`);
  };

  render() {
    const { width, height } = this.props;

    return (
      <>
        <div
          id={this.id}
          style={{
            width,
            height,
          }}
        />
        <img className="pane" src={Icon} onClick={this.onDownload} style={{ background: '#fff' }} />
      </>
    );
  }
}
