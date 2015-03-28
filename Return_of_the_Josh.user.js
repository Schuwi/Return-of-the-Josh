// ==UserScript==
// @name        Return of the Josh
// @author      Schuwi
// @namespace   http://schuwi.cat
// @description Check for new posts from Josh
// @updateURL	  https://github.com/Schuwi/Return-of-the-Josh/raw/master/Return_of_the_Josh.user.js
// @downloadURL	https://github.com/Schuwi/Return-of-the-Josh/raw/master/Return_of_the_Josh.user.js
// @include     http://forums.ltheory.com*
// @version     1.0
// @grant       GM_xmlhttpRequest
// ==/UserScript==

var kickstarter_link = 'https://www.kickstarter.com/projects/joshparnell/limit-theory-an-infinite-procedural-space-game/posts';
var forum_link = 'http://forums.ltheory.com/search.php?keywords=&terms=all&author=JoshParnell&sc=1&sf=all&sr=posts&sk=t&sd=d&st=0&ch=300&t=0&submit=Search';

var new_forum_post = false;
var new_kickstarter_post = false;
var forum_loaded = false;
var kickstarter_loaded = false;

// Calling function to load posts from Kickstarter and the Forum
invokeInfoLoading();

// Adding the banner to the document
var bannerElement = document.createElement('div');
var inner_html = document.createElement('span');
updateBanner();
bannerElement.appendChild(inner_html);

// Adding banner to document
var reference = document.getElementsByName("start_here")[0];
reference.parentNode.insertBefore(bannerElement, reference.nextSibling);

function updateBanner() {
  inner_html.style.display = 'inline-block';
  inner_html.style.verticalAlign = 'middle';
  inner_html.innerHTML = 'Loading...';
  if (forum_loaded && kickstarter_loaded) {
    // Info loaded
    if (new_forum_post ? !new_kickstarter_post : new_kickstarter_post) {
      // EITHER new forum post OR new kickstarter post
      if (new_forum_post) {
        // New forum post
        inner_html.innerHTML = 'New post on the <a style="color: rgb(38, 84, 137);" href="' + forum_link + '" target="_blank">Forum</a>';
      } else {
        // New kickstarter post
        inner_html.innerHTML = 'New post on <a style="color: rgb(137, 55, 38);" href="' + kickstarter_link + '" target="_blank">Kickstarter</a>';
      }
    } else if (new_forum_post && new_kickstarter_post) {
      // New forum post AND new kickstarter post
      inner_html.innerHTML = 'New posts on the <a style="color: rgb(38, 84, 137);" href="' + forum_link + '" target="_blank">Forum</a> and on <a style="color: rgb(137, 55, 38);" href="' + kickstarter_link + '" target="_blank">Kickstarter</a>';
    } else {
      // No new post
      inner_html.innerHTML = 'Nothing new from Josh :(';
    }
  }

  bannerElement.style.width = '100%';
  bannerElement.style.height = '50px';
  bannerElement.style.marginTop = '25px';
  bannerElement.style.textAlign = 'center';
  bannerElement.style.fontSize = '3em';
  if (!forum_loaded || !kickstarter_loaded) {
    // Info still loading
    bannerElement.style.backgroundColor = '#868508';
    bannerElement.style.color = '#383838';
  } else if (new_forum_post || new_kickstarter_post) {
    // New post found
    bannerElement.style.backgroundColor = 'rgb(55, 134, 8)';
    bannerElement.style.color = 'rgb(65, 65, 65)';
  } else {
    // Nothing new found
    bannerElement.style.backgroundColor = 'rgb(155, 21, 21)';
    bannerElement.style.color = 'rgb(113, 113, 113)';
  }
}

var handler_forum = function handler_forum(response) {
  if (!(response.readyState == 4 && response.status == 200)) return; // Check if the request has finished and we got a 200 response
  
  // Convert the string we got to a DOM document
  var doc = new DOMParser().parseFromString(response.responseText, "text/html");

  var timeElement = getElementsByClass('post', doc, 'div')[0].getElementsByTagName('dd')[0]; // Read out the time of the newest post from the website
  if (Date.parse(timeElement.innerHTML) > new Date() - 14*24*60*60*1000) new_forum_post = true; // Compare to the 'newest' post
  forum_loaded = true; // We checked the forum
  if (kickstarter_loaded) updateBanner(); // If Kickstarter was checked too, we can update the banner
}

// Same here
var handler_kickstarter = function handler_kickstarter(response) {
  if (!(response.readyState == 4 && response.status == 200)) return;

  var doc = new DOMParser().parseFromString(response.responseText, "text/html");

  var timeElement = getElementsByClass('post', doc, 'div')[0].getElementsByTagName('time')[0];
  if (Date.parse(timeElement.getAttribute('datetime')) > new Date() - 14*24*60*60*1000) new_kickstarter_post = true;
  kickstarter_loaded = true;
  if (forum_loaded) updateBanner();
}

function invokeInfoLoading() {
  // Load the forum page
  setTimeout(function() {
    GM_xmlhttpRequest({
      method: "GET",
      url: forum_link,
      onload: handler_forum
    });
  }, 0);
  
  // Load the Kickstarter page
  setTimeout(function() {
    GM_xmlhttpRequest({
      method: "GET",
      url: kickstarter_link,
      onload: handler_kickstarter
    });
  }, 0);
}

// Source: http://anyexample.com/webdev/javascript/javascript_getelementsbyclass_function.xml
function getElementsByClass( searchClass, domNode, tagName) {
	if (domNode == null) domNode = document;
	if (tagName == null) tagName = '*';
	var el = new Array();
	var tags = domNode.getElementsByTagName(tagName);
	var tcl = " "+searchClass+" ";
	for(i=0,j=0; i<tags.length; i++) { 
		var test = " " + tags[i].className + " ";
		if (test.indexOf(tcl) != -1) 
			el[j++] = tags[i];
	} 
	return el;
}
