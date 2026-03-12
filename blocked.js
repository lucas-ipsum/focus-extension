console.log("Hi from blocked");
const params = new URLSearchParams(window.location.search);
const blockedSiteId = params.get("id"); 
console.log(blockedSiteId);
const currentUrlEl = document.getElementById("current-url");
if (blockedSiteId) {
  currentUrlEl.innerHTML = `${blockedSiteId}`;
}
