
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';
import { PredatorBorderRecord } from '../types/predatorBorderHistory';
import { filterHistoryByInterval } from '../utils/historyUtils';

const width = 500; // More compact width
const height = 300; // More compact height

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

export async function createPredatorBorderGraph(history: PredatorBorderRecord[]): Promise<Buffer> {
    const filteredHistory = filterHistoryByInterval(history);
    const labels = filteredHistory.map(h => new Date(h.timestamp).toLocaleString('ja-JP'));
    const pcData = filteredHistory.map(h => h.pc);
    const psData = filteredHistory.map(h => h.ps4);
    const x1Data = filteredHistory.map(h => h.x1);

    const configuration: ChartConfiguration = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'PC',
                    data: pcData,
                    borderColor: 'rgba(255, 75, 75, 1)',
                    backgroundColor: 'rgba(255, 75, 75, 0.2)',
                    fill: false,
                },
                {
                    label: 'PlayStation',
                    data: psData,
                    borderColor: 'rgba(0, 115, 255, 1)',
                    backgroundColor: 'rgba(0, 115, 255, 0.2)',
                    fill: false,
                },
                {
                    label: 'Xbox',
                    data: x1Data,
                    borderColor: 'rgba(16, 124, 16, 1)',
                    backgroundColor: 'rgba(16, 124, 16, 0.2)',
                    fill: false,
                }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '日時'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'RP'
                    }
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    return image;
}
