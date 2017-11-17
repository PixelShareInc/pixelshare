import React, { Component } from 'react';
import './css/App.css';
import './font-awesome-4.7.0/css/font-awesome.min.css';
import io from 'socket.io-client';
import axios from 'axios';
import { ChromePicker } from 'react-color';

const url = process.env.REACT_APP_URL || 'http://localhost:3001';
const socket = io(url);

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            down: false,
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
            originY: 0,
            isLoading: true,
            palette: [
                '247a23',
                '30bf2e',
                '269e8c',
                '205988',
                '37abe4',
                '8300dc',
                'ac0f5f',
                'f42618',
                'e9671d',
                'f29221',
                'ff78e9',
                'ffcd94',
                'f0ee4d',
                '8b4513',
                'ffffff',
                'd4d4d4',
                '868686',
                '000000'
            ]
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
        this._onCurrentClick = this._onCurrentClick.bind(this);
        this.onPickerChange = this.onPickerChange.bind(this);
        this._onResize = this._onResize.bind(this);
        this._socketUpdate = this._socketUpdate.bind(this);
        this._getPixelLocation = this._getPixelLocation.bind(this);
        this._getQuiltLocation = this._getQuiltLocation.bind(this);
        this._getDocumentLocation = this._getDocumentLocation.bind(this);
        this._updatePixel = this._updatePixel.bind(this);
        this._updateOffscreenCanvas = this._updateOffscreenCanvas.bind(this);
        this._getDrawLocation = this._getDrawLocation.bind(this);
        this.onClick = this.onClick.bind(this);
        this._addColor = this._addColor.bind(this);
        this._rgbToHex = this._rgbToHex.bind(this);
        this.clearPalette = this.clearPalette.bind(this);
        this._checkPickerVisibility = this._checkPickerVisibility.bind(this);
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

            if(localStorage.getItem('palette'))
                this.setState({ palette: localStorage.getItem('palette').split(',') });

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
        return axios.get(url);
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

    _checkPickerVisibility(event) {
        let picker = document.getElementsByClassName('picker-card')[0];
        let swatch = document.getElementById('current');

        if(!picker.contains(event.target) && event.target !== swatch) {
            if(picker.style.visibility === 'visible') picker.style.visibility = 'hidden';
        }
    }

    _startListeners() {
        return new Promise((resolve, reject) => {
            let canvas = this.state.canvas;
            let current = document.getElementById('current');

            canvas.onmousedown = this._onMouseDown;
            canvas.onmouseup = this._onMouseUp;
            canvas.onmousemove = this._onMouseMove;
            canvas.onmousewheel = this._onMouseWheel;
            canvas.onmouseleave = this._onMouseLeave;
            current.onclick = this._onCurrentClick;
            window.onresize = this._onResize;
            window.onclick = this._checkPickerVisibility;
            socket.on('serverUpdate', this._socketUpdate);

            resolve();
        });
    }

    _onMouseDown(event) {
        let canvas = this.state.canvas;

        let mouseX = event.clientX - canvas.offsetLeft;
        let mouseY = event.clientY - canvas.offsetTop;

        this.setState({
            movedX: mouseX,
            movedY: mouseY,
            down: true
        });
    }

    _onMouseUp(event) {
        let canvas = this.state.canvas;

        let mouseX = event.clientX - canvas.offsetLeft;
        let mouseY = event.clientY - canvas.offsetTop;

        let moved =
            Math.abs(mouseX - this.state.movedX) > 30 ||
            Math.abs(mouseY - this.state.movedY) > 30;

        if(!moved) {
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
                    originY: prevState.originY - event.movementY / scale
                };
            });

            ctx.translate(event.movementX / scale, event.movementY / scale);
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
        this.setState({ down: false });
    }

    _onCurrentClick(event) {
        event.preventDefault();

        let picker = document.getElementsByClassName('picker-card')[0];

        picker.style.visibility = picker.style.visibility !== 'visible' ? 'visible' : 'hidden';
    }

    onPickerChange(color) {
        color = color.hex.slice(1);
        this.setState({ color });
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
        if(event.target.style.backgroundColor)
            this.setState({ color: this._rgbToHex(event.target.style.backgroundColor) });
    }

    _addColor() {
        if(!this.state.palette.includes(this.state.color)) {
            this.setState(prevState => {
                let palette = this.state.palette.length >= 20 ? prevState.palette.slice(1) : prevState.palette;
                palette.push(this.state.color);

                localStorage.setItem('palette', palette.toString());

                return { palette };
            });
        }
    }

    _rgbToHex(rgb) {
        rgb = rgb.replace(/\s+/g, '');
        rgb = rgb.split('(')[1].split(')')[0];

        let hex = rgb.split(',');

        hex = hex.map(color => {
            color = parseInt(color, 10).toString(16);
            return color.length === 1 ? '0' + color : color;
        });

        return hex.join('');
    }

    clearPalette() {
        localStorage.removeItem('palette');
        this.setState({
            palette: [
                '247a23',
                '30bf2e',
                '269e8c',
                '205988',
                '37abe4',
                '8300dc',
                'ac0f5f',
                'f42618',
                'e9671d',
                'f29221',
                'ff78e9',
                'ffcd94',
                'f0ee4d',
                '8b4513',
                'ffffff',
                'd4d4d4',
                '868686',
                '000000'
            ]
        });
    }

    componentDidMount() {
        this._init()
        .then(this._getCanvas)
        .then(this._initCanvas)
        .then(() => this.setState({ isLoading: false }))
        .then(this._startDrawLoop)
        .then(this._startListeners)
        .catch(err => console.error(err));
    }

    render() {
        return (
            <div className='App'>
                <div className='splash'>
                    <p>Pixel <br /> Share</p>
                </div>
                <canvas id='quilt'></canvas>
                {this.state.isLoading
                    ? <Loading/>
                    : null
                }
                <div className='palette'>
                    <Palette palette={this.state.palette} onClick={this.onClick} savePalette={this.savePalette} clearPalette={this.clearPalette} />
                    <div className='picker'>
                        <div>
                            <input type='button' id='add' value='Add to Palette' onClick={this._addColor} />
                            <input type='color' id='current' value={`#${this.state.color}`} readOnly />
                        </div>
                        <ChromePicker className='picker-card' disableAlpha={true} color={`#${this.state.color}`} onChangeComplete={this.onPickerChange} />
                    </div>
                </div>
            </div>
        );
    }
}

const Palette = ({ palette, onClick, clearPalette }) =>
    <div id='paletteContainer'>
        <div id='paletteButtons'>
            <input type='button' value='Clear Palette' onClick={clearPalette} />
        </div>
        <div id='palette' onClick={onClick}>
            {palette.length > 1 ?
                palette.map(color => {
                    let id = `color${color}`;
                    let style = {
                        backgroundColor: '#' + color
                    }
                    return <div key={id} className='color' style={style}></div>
                })
                : null
            }
        </div>
    </div>

const Loading = () =>
    <div id="loading">
        <i className="fa fa-spinner fa-pulse fa-3x fa-fw"></i>
        <span className="sr-only">Loading...</span>
    </div>

export default App;
