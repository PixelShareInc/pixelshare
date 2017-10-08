import React, {Component} from 'react';
import './css/App.css';

const axios = require('axios');
const $ = require('jquery');

class App extends Component {
    componentDidMount() {
        const canvas = document.getElementById('quilt');
        canvas.width = 2000;
        canvas.height = 2000;
        const ctx = canvas.getContext('2d');
        ctx.scale(2,2);

        axios.get('http://localhost:3001/')
        .then(result => {
            let iterator = 0;

            for(let b = 0; b < 100; b++){
                for(let row = 0; row < 50; row++){
                    let rowColors = result.data[iterator].color.split(',');

                    for(let col = 0; col < 50; col++){
                        let loc = getLocation(b, row, col);

                        ctx.fillStyle = `#${rowColors[col]}`;
                        ctx.fillRect(loc.x, loc.y, 2, 2);
                    }

                    iterator++;
                }
            }
        })
        .then(() => {
            $('#quilt').click((event) => {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(500, 500, 2, 2);
            });
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

function getLocation(b, row, col){
    let x = ((b % 10) * 100) + col * 2;
    let y = (Math.floor(b / 10) * 100) + row * 2;

    return {x, y};
}

export default App;
