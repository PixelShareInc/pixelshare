import React, {Component} from 'react';
import './css/App.css';

const axios = require('axios');
const $ = require('jquery');

class App extends Component {
    componentWillMount() {
        let quilt = [];
        let canvas;
        let region;
        let block;
        let pixel;

        axios.get('http://localhost:3001/')
        .then(result => {
            let iterator = 0;

            for(let r = 0; r < 6; r++){
                quilt.push([]);
                for(let b = 0; b < 100; b++){
                    quilt[r].push([])
                    for(let row = 0; row < 50; row++){
                        quilt[r][b].push([]);
                        let rowColors = result.data[iterator].color.split(',');

                        rowColors.forEach(color => quilt[r][b][row].push(color));

                        iterator++;
                    }
                }
            }
        })
        // .then(result => {
        //     let iterator = 0;
        //     canvas = document.getElementById('quilt');
        //
        //     for(let r = 0; r < 4; r++){
        //         region = document.createElement('div');
        //         region.setAttribute('class', 'region');
        //
        //         for(let b = 0; b < 100; b++){
        //             block = document.createElement('div');
        //             block.setAttribute('class', 'block');
        //
        //             for(let row = 0; row < 50; row++){
        //                 let rowColors = result.data[iterator].color.split(',');
        //
        //                 rowColors.forEach(color => {
        //                     color = `#${color}`;
        //                     pixel = document.createElement('div');
        //                     pixel.setAttribute('class', 'pixel');
        //                     pixel.style.backgroundColor = color;
        //
        //                     block.appendChild(pixel);
        //                 });
        //
        //                 iterator++;
        //             }
        //
        //             region.appendChild(block);
        //         }
        //
        //         canvas.appendChild(region);
        //     }
        // })
        .catch(err => console.error(new Error(err)));
    }

    render() {
        return (
            <div className="App">
                <h1>PixelShare</h1>
                <div id='quilt'></div>
            </div>
        );
    }
}

export default App;
