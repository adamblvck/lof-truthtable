# Laws of Form - Truth Table Explorer

## About

A little web app to help explore Laws of Form expressions through truth tables.

## Evaluation of Expressions

...

## Credits

- Laws of Form - George Spencer-Brown
- Laws of Form Notation for React - Kevin

## Build Game to Github Pages

Tarati is deployed for free on GitHub pages. Publish by configuring `gh-pages` correctly.

Install gh-pages:

```
npm install gh-pages --save-dev
```

Add the following to package.json

```javascript
"scripts": { // <-- in scripts in package.json
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build", // <-- add this line
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
```

Also add the final github url of your repo to the package.json file:

```javascript
{
  "name": "tarati-react",
  "version": "0.1.0",
  "author": "adamblvck",
  "homepage": "https://adamblvck.github.io/tarati-react",
  "private": false,
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/utilities": "^3.2.2",
    ...
  }
  ,
  ...
}

Then run the deploy command:
```
npm run deploy
```