import React, {Component} from 'react';
import './css/App.css';
import io from 'socket.io-client';

const axios = require('axios');
const socket = io('http://localhost:3001');

let scale, originalScale, quilt, canvas;
let originX = 0;
let originY = 0;

socket.on('serverUpdate', (doc, b, row, col, newColors) => {
    quilt[doc].color = newColors;
    newColors = newColors.split(',');
    let newColor = newColors[col];

    updateOffscreenCanvas(newColor, canvas.offscreenCtx, b, row, col);
});

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            down: false,
            moved: false,
            color: 'ffffff'
        };

        this.onClick = this.onClick.bind(this);
    }

    onClick(event) {
        this.setState({ color: event.target.id.slice(5) });
    }

    componentDidMount() {
        canvas = document.getElementById('quilt');
        const ctx = canvas.getContext('2d');
        canvas.width = 2000;
        canvas.height = 2000;
        let zoomIntensity = 0.2;
        let movedX = 0;
        let movedY = 0;

        canvas.offscreenCanvas = document.createElement('canvas');
        canvas.offscreenCanvas.width = canvas.width * 2;
        canvas.offscreenCanvas.height = canvas.height * 2;
        canvas.offscreenCtx = canvas.offscreenCanvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;

        canvas.offscreenCtx.scale(8, 8);

        originalScale = scale = window.getComputedStyle(canvas, null).getPropertyValue('width').slice(0, -2) * 0.0005;

        axios.get('http://localhost:3001/')
        .then(result => {
            quilt = result.data;
            initOffscreenCanvas(quilt, canvas.offscreenCtx);
        })
        .then(() => {
            setInterval(() => drawCanvas(ctx, canvas.offscreenCanvas), 10);
        })
        .then(() => {
            canvas.onmousedown = () => this.setState({ down: true });

            canvas.onmouseup = event => {
                if(this.state.moved === false) {
                    let { pixelX, pixelY } = getPixelLocation(event, canvas);
                    let { b, row } = getQuiltLocation(pixelX, pixelY);
                    let { doc, col } = getDocumentLocation(pixelX, pixelY);

                    if(pixelX >= 0 && pixelX < 500 && pixelY >= 0 && pixelY < 500) {
                        quilt[doc].color = updatePixel(quilt[doc].color, this.state.color, col);

                        updateOffscreenCanvas(this.state.color, canvas.offscreenCtx, b, row, col);

                        socket.emit('clientUpdate', doc, b, row, col, quilt[doc].color);
                    }
                }

                movedX = movedY = 0;

                this.setState({ down: false, moved: false });
            }

            canvas.onmousemove = event => {
                if(this.state.down) {
                    originX -= event.movementX / scale;
                    originY -= event.movementY / scale;
                    ctx.translate(event.movementX / scale, event.movementY / scale);

                    movedX += Math.abs(event.movementX / scale);
                    movedY += Math.abs(event.movementY / scale);
                }

                if(movedX > 1 || movedY > 1) {
                    this.setState({ moved: true });
                }
            }

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
                }
            }

            canvas.onmouseleave = () => this.setState({ down: false, moved: true });

            window.onresize = () => {
                scale /= originalScale;
                originalScale = window.getComputedStyle(canvas, null).getPropertyValue('width').slice(0, -2) * 0.0005;
                scale *= originalScale;
            };
        })
        .catch(err => console.error(err));
    }

    render() {
        return (
            <div className='App'>
                <div className='splash'>
                </div>
                <canvas id='quilt'></canvas>
                <div className='palette'>
                    <Palette onClick={this.onClick} />
                </div>
            </div>
        );
    }
}

const Palette = ({onClick}) =>
    <div id='palette' onClick={onClick}>
        <div className='color' id='color247a23'></div>
        <div className='color' id='color30bf2e'></div>
        <div className='color' id='color269e8c'></div>
        <div className='color' id='color205988'></div>
        <div className='color' id='color37abe4'></div>
        <div className='color' id='color8300dc'></div>
        <div className='color' id='colorac0f5f'></div>
        <div className='color' id='colorf42618'></div>
        <div className='color' id='colore9671d'></div>
        <div className='color' id='colorf29221'></div>
        <div className='color' id='colorff78e9'></div>
        <div className='color' id='colorffcd94'></div>
        <div className='color' id='colorf0ee4d'></div>
        <div className='color' id='color8b4513'></div>
        <div className='color' id='colorffffff'></div>
        <div className='color' id='colord4d4d4'></div>
        <div className='color' id='color868686'></div>
        <div className='color' id='color000000'></div>
    </div>

function updatePixel(doc, color, col) {
    col *= 7;
    return doc.substr(0, col) + color + doc.substr(col + color.length);
}

function getQuiltLocation(pixelX, pixelY) {
    let b = Math.floor(pixelY / 50) * 10 + Math.floor(pixelX / 50);
    let row = pixelY % 50;

    return { b, row };
}

function getDocumentLocation(x, y) {
    let doc = Math.floor(x / 50) * 50 + Math.floor(y / 50) * 500 + y % 50;
    let col = x % 50;

    return { doc, col };
}

function getPixelLocation(event, canvas) {
    let mouseX = event.clientX - canvas.offsetLeft;
    let mouseY = event.clientY - canvas.offsetTop;

    let pixelX = Math.floor((originX + mouseX / scale) / 4);
    let pixelY = Math.floor((originY + mouseY / scale) / 4);

    return { pixelX, pixelY };
}

function drawCanvas(ctx, offscreenCanvas) {
    ctx.fillStyle = 'white';
    ctx.fillRect(originX, originY, 2000, 2000);

    ctx.drawImage(offscreenCanvas, 0, 0, 2000, 2000)
}

function initOffscreenCanvas(result, ctx) {
    let iterator = 0;

    for(let b = 0; b < 100; b++) {
        for(let row = 0; row < 50; row++) {
            let rowColors = result[iterator].color.split(',');

            for(let col = 0; col < 50; col++){
                let loc = getDrawLocation(b, row, col);

                ctx.fillStyle = `#${rowColors[col]}`;
                ctx.fillRect(loc.x, loc.y, 1.15, 1.15);
            }

            iterator++;
        }
    }
}

function updateOffscreenCanvas(color, ctx, b, row, col) {
    let loc = getDrawLocation(b, row, col);

    ctx.fillStyle = `#${color}`;
    ctx.fillRect(loc.x, loc.y, 1, 1);
}

function getDrawLocation(b, row, col) {
    let x = (b % 10) * 50 + col;
    let y = Math.floor(b / 10) * 50 + row;

    return {x, y};
}

export default App;
