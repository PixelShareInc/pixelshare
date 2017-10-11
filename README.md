![PixelShare](readme-src/banner.png)

# [PixelShare](https://github.com/PixelShareInc/pixelshare "PixelShare")

[![Build Status](https://travis-ci.org/PixelShareInc/pixelshare.svg?branch=master)](https://travis-ci.org/PixelShareInc/pixelshare)
[![GitHub release](https://img.shields.io/github/release/PixelShareInc/pixelshare.svg)]()
[![Code Climate](https://codeclimate.com/github/PixelShareInc/pixelshare/badges/gpa.svg)](https://codeclimate.com/github/PixelShareInc/pixelshare)
[![Issue Count](https://codeclimate.com/github/PixelShareInc/pixelshare/badges/issue_count.svg)](https://codeclimate.com/github/PixelShareInc/pixelshare)
[![Dependencies Status](https://david-dm.org/PixelShareInc/pixelshare.svg)](https://david-dm.org/PixelShareInc/pixelshare)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FPixelShareInc%2Fpixelshare.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FPixelShareInc%2Fpixelshare?ref=badge_shield)

---

**PixelShare** is a simple and easy-to-use amalgamated art project. Users can access the quilt without login and can add their own pixel art to it. The application is built on the [React](https://reactjs.org/) framework, styled with [Sass](https://sass-lang.com). The API uses a [NodeJS](https://nodejs.org) back end with [Express](https://expressjs.com) and [MongoDB](https://mongodb.com).  

<!-- ![Screenshot](readme-src/screenshot.png) -->

## Table of contents

- [Installation for Development](#Installation)
- [Community Resources](#Resources)
- [License](#License)

## <a name="Installation"><a>Installation for Development

First ensure that you have Node and Git installed by entering:

```
$ brew update
$ brew install node
$ brew install git
```

Then, navigate into the directory where you want to clone the repository and enter:

```
$ git clone https://www.github.com/PixelShareInc/pixelshare.git
```

#### API

Proper development operation requires the PixelShare API and MongoDB. First ensure that you have MongoDB installed:

```
$ mongod --version
```

If you don't have MongoDB installed, either follow the [instructions](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/) on their website, or install using brew with [Treehouse](https://treehouse.github.io/installation-guides/mac/mongo-mac.html).

Once you've installed MongoDB, in a separate terminal window, start the service:

```
$ mongod
```

Then, navigate into the directory where you want to clone the PixelShare API repository and enter:

```
$ git clone https://www.github.com/PixelShareInc/API.git
```

Navigate into the API directory and install dependencies:

```
$ npm install
```

Then create the `pixelshare` database, collections, and documents:

```
$ node db/migrate.js
$ node db/seed.js
```

Finally start the API server by running:

```
$ npm start
```

#### Back to the client

Navigate back into the front end repository directory you cloned earlier and install dependencies:

```
$ npm install
```

Then, with the API server running on `localhost:3001`, start the front end server:

```
$ npm start
```

Your PixelShare development front end should be available at `localhost:3000`


*To edit the styling, while in the front end directory, enter:*

```
$ gulp
```

*Then only edit the `.scss` files in the `src/scss/` directory*

## <a name="Resources"><a>Community Resources


##### &emsp;&emsp;&emsp;&emsp;&emsp; [<img src="https://cosmicjs.com/uploads/9c2d95d0-27b0-11e7-b6ae-8108cf4caa96-react.svg" height="50" align="top">](https://reactjs.org)
##### &emsp;&emsp;&emsp;&emsp;&emsp; [<img src="http://sass-lang.com/assets/img/styleguide/color-1c4aab2b.png" height="50" align="top">](http://sass-lang.com)
##### &emsp;&emsp;&emsp;&emsp;&emsp; [<img src="https://jwt.io/assets/logo.svg" height="50" align="top">](http://www.jwt.io)
##### &emsp;&emsp;&emsp;&emsp;&emsp; [<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Node.js_logo_2015.svg/591px-Node.js_logo_2015.svg.png" height="50" align="top">](https://nodejs.org)
##### &emsp;&emsp;&emsp;&emsp;&emsp; [<img src="http://www.amt.in/img/services/express.png" height="50" align="top">](https://expressjs.com)
##### &emsp;&emsp;&emsp;&emsp;&emsp; [<img src="https://webassets.mongodb.com/_com_assets/cms/MongoDB-Logo-5c3a7405a85675366beb3a5ec4c032348c390b3f142f5e6dddf1d78e2df5cb5c.png" height="50" align="top">](https://mongodb.com)

## <a name="License"><a>License

The MIT License (MIT)

Copyright &copy; 2017 PixelShareInc

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
