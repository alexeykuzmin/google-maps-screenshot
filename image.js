'use strict';

const imageData = window.localStorage.getItem('imageData');
const imageElement = document.getElementById('image');
imageElement.src = imageData;
