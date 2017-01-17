'use strict';

const urlPattern = '.*\.google\.[A-z]+/maps/.*';

// Show and hide Page Action.
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        // That fires when a page's URL contains a 'g' ...
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {urlMatches: urlPattern},
          })
        ],
        // And shows the extension's page action.
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });
});

// React on Page Action click.
chrome.pageAction.onClicked.addListener(function() {
  hidePageElements()
      .then(wait)  // For repaint, I guess.
      .then(takeScreenshot)
      .then(function(dataUrl) {
        // Elements should be restored before opening a new tab.
        restorePageElements();
        return showImage(dataUrl);
      });
});

/**
 * @param {string} dataUrl
 * @return {!Promise}
 */
function showImage(dataUrl) {
  window.localStorage.setItem('imageData', dataUrl);
  return openTab('/image.html');
}

/**
 * @param {string} url
 * @return {!Promise}
 */
function openTab(url) {
  return chromise.tabs.create({url: url});
}

/**
 * @return {!Promise}
 */
function takeScreenshot() {
  const options = {format: 'jpeg', quality: 100};
  return chromise.tabs.captureVisibleTab(options);
}

/**
 * @type {!Array.<string>} CSS selectors.
 */
const elementsToHide = [
  '[id="titlecard"]',
  '[class~="noprint"]',
  '[class~="widget-minimap"]',
];

const classToUse = 'hide-for-screenshot';

/**
 * @return {!Promise}
 */
function hidePageElements() {
  const codeToExecute = `
    for (const s of ${JSON.stringify(elementsToHide)}) {
      for (const e of document.querySelectorAll(s)) {
        e.classList.add("${classToUse}");
      }
    }
  `;
  const cssToInsert = `.${classToUse} {display: none}`;

  return Promise.all([
    chromise.tabs.executeScript({code: codeToExecute}),
    chromise.tabs.insertCSS({code: cssToInsert}),
  ]);
}

/**
 * @return {!Promise}
 */
function restorePageElements() {
  const codeToExecute = `
    for (const s of ${JSON.stringify(elementsToHide)}) {
      for (const e of document.querySelectorAll(s)) {
        e.classList.remove("${classToUse}");
      }
    }
  `;
  return chromise.tabs.executeScript({code: codeToExecute});
}

/**
 * @return {!Promise}
 */
function wait() {
  return new Promise(function(resolve) {
    window.setTimeout(resolve, 200);  // 0.2 sec.
  });
}