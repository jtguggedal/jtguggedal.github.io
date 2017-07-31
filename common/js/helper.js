
function qs(selector) {
    return document.querySelector(selector);
}

function clickListener(el, cb) {
    qs(el).addEventListener("click", cb);
}
