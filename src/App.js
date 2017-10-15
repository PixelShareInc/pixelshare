import React, { Component } from 'react';
import './css/App.css';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3001');

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            down: false,
            moved: false,
            color: 'ffffff',
            canvas: null,
            ctx: null,
            zoomIntensity: 0.2,
            offscreenCanvas: null,
            offscreenCtx: null,
            scale: null,
            originalScale: null,
            movedX: 0,
            movedY: 0,
            quilt: null,
            originX: 0,
            originY: 0
        };

        this._init = this._init.bind(this);
        this._getCanvas = this._getCanvas.bind(this);
        this._initCanvas = this._initCanvas.bind(this);
        this._startDrawLoop = this._startDrawLoop.bind(this);
        this._drawCanvas = this._drawCanvas.bind(this);
        this._startListeners = this._startListeners.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseWheel = this._onMouseWheel.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onResize = this._onResize.bind(this);
        this._socketUpdate = this._socketUpdate.bind(this);
        this._getPixelLocation = this._getPixelLocation.bind(this);
        this._getQuiltLocation = this._getQuiltLocation.bind(this);
        this._getDocumentLocation = this._getDocumentLocation.bind(this);
        this._updatePixel = this._updatePixel.bind(this);
        this._updateOffscreenCanvas = this._updateOffscreenCanvas.bind(this);
        this._getDrawLocation = this._getDrawLocation.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    _init() {
        return new Promise((resolve, reject) => {
            let canvas = document.getElementById('quilt');
            canvas.width = 2000;
            canvas.height = 2000;
            let ctx = canvas.getContext('2d');

            let offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = canvas.width * 2;
            offscreenCanvas.height = canvas.height * 2;
            let offscreenCtx = offscreenCanvas.getContext('2d');

            ctx.imageSmoothingEnabled = false;

            offscreenCtx.scale(8, 8);

            let scale = window.getComputedStyle(canvas, null).getPropertyValue('width').slice(0, -2) * 0.0005;

            this.setState({
                canvas: canvas,
                ctx: ctx,
                offscreenCanvas: offscreenCanvas,
                offscreenCtx: offscreenCtx,
                scale: scale,
                originalScale: scale,
                quilt: null
            }, () => {
                resolve();
            });
        });
    }

    _getCanvas() {
        return axios.get('http://localhost:3001/');
    }

    _initCanvas(result) {
        return new Promise((resolve, reject) => {
            this.setState({ quilt: result.data });

            let iterator = 0;

            for(let b = 0; b < 100; b++) {
                for(let row = 0; row < 50; row++) {
                    let rowColors = result.data[iterator].color.split(',');

                    for(let col = 0; col < 50; col++) {
                        let loc = this._getDrawLocation(b, row, col);
                        let ctx = this.state.offscreenCtx;

                        ctx.fillStyle = `#${rowColors[col]}`;
                        ctx.fillRect(loc.x, loc.y, 1.15, 1.15);
                    }

                    iterator++;
                }
            }

            resolve();
        });
    }

    _startDrawLoop() {
        return new Promise((resolve, reject) => {
            requestAnimationFrame(this._drawCanvas);
            resolve();
        });
    }

    _drawCanvas() {
        let { ctx, offscreenCanvas } = this.state;

        ctx.fillStyle = 'white';
        ctx.fillRect(this.state.originX, this.state.originY, 2000, 2000);

        ctx.drawImage(offscreenCanvas, 0, 0, 2000, 2000);

        requestAnimationFrame(this._drawCanvas);
    }

    _startListeners() {
        return new Promise((resolve, reject) => {
            let canvas = this.state.canvas;

            canvas.onmousedown = this._onMouseDown;
            canvas.onmouseup = this._onMouseUp;
            canvas.onmousemove = this._onMouseMove;
            canvas.onmousewheel = this._onMouseWheel;
            canvas.onmouseleave = this._onMouseLeave;
            canvas.onmouseenter = this._onMouseEnter;
            window.onresize = this._onResize;
            socket.on('serverUpdate', this._socketUpdate);

            resolve();
        });
    }

    _onMouseDown() {
        this.setState({ down: true });
    }

    _onMouseUp(event) {
        if(this.state.moved === false) {
            let { pixelX, pixelY } = this._getPixelLocation(event);
            let { b, row } = this._getQuiltLocation(pixelX, pixelY);
            let { doc, col } = this._getDocumentLocation(pixelX, pixelY);

            if(pixelX >= 0 && pixelX < 500 && pixelY >= 0 && pixelY < 500) {
                this._updatePixel(doc, col);

                this._updateOffscreenCanvas(b, row, col);

                socket.emit('clientUpdate', doc, b, row, col, this.state.quilt[doc].color);
            }
        }

        this.setState({
            down: false,
            moved: false,
            movedX: 0,
            movedY: 0
        });
    }

    _onMouseMove(event) {
        if(this.state.down) {
            let ctx = this.state.ctx;
            let scale = this.state.scale;

            this.setState(prevState => {
                return {
                    originX: prevState.originX - event.movementX / scale,
                    originY: prevState.originY - event.movementY / scale,
                    movedX: prevState.movedX + event.movementX / scale,
                    movedY: prevState.movedY + event.movementY / scale
                };
            });

            ctx.translate(event.movementX / scale, event.movementY / scale);
        }

        if(this.state.movedX > 1 || this.state.movedY > 1) {
            this.setState({ moved: true });
        }
    }

    _onMouseWheel(event) {
        event.preventDefault();

        let { canvas, ctx, scale, originalScale, zoomIntensity, originX, originY } = this.state;

        let mouseX = event.clientX - canvas.offsetLeft;
        let mouseY = event.clientY - canvas.offsetTop;
        let wheel = event.wheelDelta / 120;
        let zoom = Math.exp(wheel * zoomIntensity);

        if(scale * zoom >= originalScale && scale * zoom < 50) {
            ctx.translate(originX, originY);

            this.setState(prevState => {
                let newOriginX = mouseX / (scale * zoom) - mouseX / scale;
                let newOriginY = mouseY / (scale * zoom) - mouseY / scale;
                return {
                    originX: prevState.originX - newOriginX,
                    originY: prevState.originY - newOriginY
                };
            }, () => {
                ctx.scale(zoom, zoom);

                ctx.translate(-this.state.originX, -this.state.originY);

                this.setState(prevState => {
                    return { scale: prevState.scale * zoom };
                });
            });
        }
    }

    _onMouseLeave() {
        this.setState({ down: false, moved: true });
    }

    _onMouseEnter() {
        this.setState({ moved: false });
    }

    _onResize() {
        let canvas = this.state.canvas;

        this.setState(prevState => {
            return {
                scale: prevState.scale / prevState.originalScale,
                originalScale: window.getComputedStyle(canvas, null).getPropertyValue('width').slice(0, -2) * 0.0005
            };
        }, () => {
            this.setState(prevState => {
                return {
                    scale: prevState.scale * prevState.originalScale
                };
            });
        });
    }

    _socketUpdate(doc, b, row, col, newColors) {
        let { quilt } = this.state;
        quilt[doc].color = newColors;
        newColors = newColors.split(',');
        let newColor = newColors[col];

        this._updateOffscreenCanvas(b, row, col, newColor);
    }

    _getPixelLocation(event) {
        let canvas = this.state.canvas;

        let mouseX = event.clientX - canvas.offsetLeft;
        let mouseY = event.clientY - canvas.offsetTop;

        let pixelX = this.state.originX + mouseX / this.state.scale;
        let pixelY = this.state.originY + mouseY / this.state.scale;

        [pixelX, pixelY] = [pixelX, pixelY].map(pixel => Math.floor(pixel / 4));

        return { pixelX, pixelY };
    }

    _getQuiltLocation(pixelX, pixelY) {
        let b = Math.floor(pixelY / 50) * 10 + Math.floor(pixelX / 50);
        let row = pixelY % 50;

        return { b, row };
    }

    _getDocumentLocation(x, y) {
        let doc = Math.floor(x / 50) * 50 + Math.floor(y / 50) * 500 + y % 50;
        let col = x % 50;

        return { doc, col };
    }

    _updatePixel(doc, col) {
        let quilt = this.state.quilt;
        let colors = quilt[doc].color;
        col *= 7;

        quilt[doc].color = colors.substr(0, col) + this.state.color + colors.substr(col + this.state.color.length);
    }

    _updateOffscreenCanvas(b, row, col, newColor = null) {
        let ctx = this.state.offscreenCtx;
        let loc = this._getDrawLocation(b, row, col);

        if(!newColor) {
            ctx.fillStyle = `#${this.state.color}`;
            ctx.fillRect(loc.x, loc.y, 1, 1);
        } else {
            ctx.fillStyle = `#${newColor}`;
            ctx.fillRect(loc.x, loc.y, 1, 1);
        }
    }

    _getDrawLocation(b, row, col) {
        let x = (b % 10) * 50 + col;
        let y = Math.floor(b / 10) * 50 + row;

        return { x, y };
    }

    onClick(event) {
        this.setState({ color: event.target.id.slice(5) });
    }

    componentDidMount() {
        this._init()
        .then(this._getCanvas)
        .then(this._initCanvas)
        .then(this._startDrawLoop)
        .then(this._startListeners)
        .catch(err => console.error(err));
    }

    render() {
        return (
            <div className='App'>
                <div className='splash'>
                    <h1>Pixel <br /> Share</h1>
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

export default App;
