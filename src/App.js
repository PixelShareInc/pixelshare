import React, {Component} from 'react';
import './css/App.css';

const axios = require('axios');

let scale, originalScale, quilt;
let originX = 0;
let originY = 0;

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            down: false,
            moved: false,
            color: 'ff0000'
        };
    }

    componentDidMount() {
        const canvas = document.getElementById('quilt');
        const ctx = canvas.getContext('2d');
        let width = canvas.width = 2000;
        let height = canvas.height = 2000;
        let visibleWidth = width;
        let visibleHeight = height;
        let zoomIntensity = 0.2;
        let movedX = 0;
        let movedY = 0;

        ctx.scale(4, 4);

        originalScale = scale = window.getComputedStyle(canvas, null).getPropertyValue('width').slice(0, -2) * 0.002;

        axios.get('http://localhost:3001/')
        .then(result => {
            quilt = result.data;
            setInterval(() => drawCanvas(quilt, ctx), 10);
        })
        .then(() => {
            canvas.onmousedown = () => this.setState({ down: true });

            canvas.onmouseup = event => {
                if(this.state.moved === false) {
                    let { pixelX, pixelY } = getPixelLocation(event, canvas);
                    let { doc, col } = getDocumentLocation(pixelX, pixelY);
                    // console.log(doc, quilt[doc], col);
                    quilt[doc].color = updatePixel(quilt[doc].color, this.state.color, col);

                    document.getElementById('location').innerHTML = 'X: ' + pixelX + ', Y: ' + pixelY;
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
                    visibleWidth = width / scale;
                    visibleHeight = height / scale;
                }
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
                <div className='splash'>
                </div>
                <canvas id='quilt'></canvas>
                <div className='palette'>
                    <p>Pixel location: <span id='location'></span></p>
                </div>
            </div>
        );
    }
}

function updatePixel(doc, color, col) {
    col *= 7;
    return doc.substr(0, col) + color + doc.substr(col + color.length);
}

function getDocumentLocation(x, y) {
    let doc = Math.floor(x / 50) * 50 + Math.floor(y / 50) * 500 + y % 50;
    let col = x % 50;

    return { doc, col };
}

function getPixelLocation(event, canvas) {
    let mouseX = event.clientX - canvas.offsetLeft;
    let mouseY = event.clientY - canvas.offsetTop;

    let pixelX = Math.floor(originX + mouseX / scale);
    let pixelY = Math.floor(originY + mouseY / scale);

    return { pixelX, pixelY };
}

function drawCanvas(result, ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(originX, originY, 2000 / scale, 2000 / scale);

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

function getDrawLocation(b, row, col) {
    let x = (b % 10) * 50 + col;
    let y = Math.floor(b / 10) * 50 + row;

    return {x, y};
}

export default App;
