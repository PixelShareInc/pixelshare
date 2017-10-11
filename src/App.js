import React, {Component} from 'react';
import './css/App.css';

const axios = require('axios');

let scale, originalScale;
let originX = 0;
let originY = 0;

class App extends Component {
    componentDidMount() {
        const canvas = document.getElementById('quilt');
        const ctx = canvas.getContext('2d');
        let width = canvas.width = 2000;
        let height = canvas.height = 2000;
        let visibleWidth = width;
        let visibleHeight = height;
        let zoomIntensity = 0.2;

        ctx.scale(4, 4);

        originalScale = scale = window.getComputedStyle(canvas, null).getPropertyValue('width').slice(0, -2) * 0.002;

        axios.get('http://localhost:3001/')
        .then(result => setInterval(() => drawCanvas(result, ctx), 10))
        .then(() => {
            canvas.onclick = event => {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(500, 500, 20, 20);
            };

            canvas.onmousewheel = event => {
                event.preventDefault();

                let mouseX = event.clientX - canvas.offsetLeft;
                let mouseY = event.clientY - canvas.offsetTop;
                let wheel = event.wheelDelta / 120;
                let zoom = Math.exp(wheel * zoomIntensity);

                if(scale * zoom >= originalScale) {
                    ctx.translate(originX, originY);

                    originX -= mouseX / (scale * zoom) - mouseX / scale;
                    originY -= mouseY / (scale * zoom) - mouseY / scale;

                    ctx.scale(zoom, zoom);

                    ctx.translate(-originX, -originY);

                    scale *= zoom;
                    visibleWidth = width / scale;
                    visibleHeight = height / scale;
                }

                console.log(originX, originY);
            }

            window.onresize = () => {
                scale /= originalScale;
                originalScale = window.getComputedStyle(canvas, null).getPropertyValue('width').slice(0, -2) * 0.002;
                scale *= originalScale;
            };
        })
        .catch(err => console.error(err));
    }

    render() {
        return (
            <div className='App'>
                <div className='container'>
                    <canvas id='quilt'></canvas>
                </div>
            </div>
        );
    }
}

function drawCanvas(result, ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(originX, originY, 2000 / scale, 2000 / scale);

    let iterator = 0;

    for(let b = 0; b < 100; b++) {
        for(let row = 0; row < 50; row++) {
            let rowColors = result.data[iterator].color.split(',');

            for(let col = 0; col < 50; col++){
                let loc = getLocation(b, row, col);

                ctx.fillStyle = `#${rowColors[col]}`;
                ctx.fillRect(loc.x, loc.y, 1.15, 1.15);
            }

            iterator++;
        }
    }
}

function getLocation(b, row, col) {
    let x = (b % 10) * 50 + col;
    let y = Math.floor(b / 10) * 50 + row;

    return {x, y};
}

export default App;
