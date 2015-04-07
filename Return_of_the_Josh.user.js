// ==UserScript==
// @name        Return of the Josh
// @author      Schuwi
// @namespace   http://schuwi.cat
// @description Check for new posts from Josh
// @updateURL	  https://github.com/Schuwi/Return-of-the-Josh/raw/master/Return_of_the_Josh.user.js
// @downloadURL	https://github.com/Schuwi/Return-of-the-Josh/raw/master/Return_of_the_Josh.user.js
// @include     http://forums.ltheory.com*
// @version     1.2
// @grant       GM_xmlhttpRequest
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

var kickstarter_link = 'https://www.kickstarter.com/projects/joshparnell/limit-theory-an-infinite-procedural-space-game/posts';
var forum_link = 'http://forums.ltheory.com/search.php?keywords=&terms=all&author=JoshParnell&sc=1&sf=all&sr=posts&sk=t&sd=d&st=0&ch=300&t=0&submit=Search';
var twitter_josh_link = 'https://twitter.com/proceduralguy';
var twitter_lt_link = 'https://twitter.com/LimitTheory';

var kickstarter_ref = '<a style="color: #264089;" href="' + kickstarter_link + '" target="_blank">Kickstarter</a>';
var forum_ref = 'the <a style="color: #264089;" href="' + forum_link + '" target="_blank">Forum</a>';
var twitter_josh_ref = '<a style="color: #264089;" href="' + twitter_josh_link + '" target="_blank">Twitter(proceduralguy)</a>';
var twitter_lt_ref = '<a style="color: #264089;" href="' + twitter_lt_link + '" target="_blank">Twitter(LimitTheory)</a>';

var no_posts_pattern = 'Nothing new from Josh :(';
var one_post_pattern = 'New post on {0}';
var two_posts_pattern = 'New posts on {0} and {1}';
var three_posts_pattern = 'New posts on {0}, {1} and {2}';
var four_posts_pattern = 'New posts on {0}, {1}, {2} and {3}';

var posts = 0;
var post_refs = new Array();

var loaded = 0;

// Adding wrapper to document
var wrapperElement = document.createElement('div');
var reference = document.getElementsByName("start_here")[0];
reference.parentNode.insertBefore(wrapperElement, reference.nextSibling);

if (new Date(GM_getValue('lastUpdate', '0')) > new Date() - 30*60*1000 && GM_getValue('cachedBanner', false)) {
  wrapperElement.innerHTML = GM_getValue('cachedBanner');
  return;
}

// Inject the string.format() function
injectStringFormat();

// Calling function to load posts from Kickstarter and the Forum
invokeInfoLoading();

// Adding the banner to the document
var bannerElement = document.createElement('div');
var inner_html = document.createElement('span');
updateBanner();
wrapperElement.appendChild(bannerElement);
bannerElement.appendChild(inner_html);

function updateBanner() {
  inner_html.style.display = 'inline-block';
  inner_html.style.verticalAlign = 'middle';
  inner_html.innerHTML = 'Loading...';
  if (loaded == 4) {
    // Info loaded
    switch (posts) {
      case 0:
        inner_html.innerHTML = no_posts_pattern;
        break;
      case 1:
        inner_html.innerHTML = one_post_pattern.format(post_refs);
        break;
      case 2:
        inner_html.innerHTML = two_posts_pattern.format(post_refs);
        break;
      case 3:
        inner_html.innerHTML = three_posts_pattern.format(post_refs);
        break;
      case 4:
        inner_html.innerHTML = four_posts_pattern.format(post_refs);
        break;
    }
  }

  bannerElement.style.width = '100%';
  bannerElement.style.marginTop = '25px';
  bannerElement.style.paddingBottom = '5px';
  bannerElement.style.textAlign = 'center';
  bannerElement.style.fontSize = '3em';
  if (loaded != 4) {
    // Info still loading
    bannerElement.style.backgroundColor = '#868508';
    bannerElement.style.color = '#383838';
  } else if (posts > 0) {
    // New post found
    bannerElement.style.backgroundColor = '#378608';
    bannerElement.style.color = '#414141';
  } else {
    // Nothing new found
    bannerElement.style.backgroundColor = '#9B1515';
    bannerElement.style.color = '#717171';
  }
  if (loaded == 4) {
    GM_setValue('cachedBanner', wrapperElement.innerHTML);
    GM_setValue('lastUpdate', new Date().toString());
  }
}

var handler_forum = function handler_forum(response) {
  if (!(response.readyState == 4 && response.status == 200)) return; // Check if the request has finished and we got a 200 response
  
  // Convert the string we got to a DOM document
  var doc = new DOMParser().parseFromString(response.responseText, "text/html");

  var timeElement = getElementsByClass('post', doc, 'div')[0].getElementsByTagName('dd')[0]; // Read out the time of the newest post from the website
  if (Date.parse(timeElement.innerHTML) > new Date() - 14*24*60*60*1000) { // Compare to the 'newest' post
    post_refs[posts] = forum_ref;
    posts++;
  }
  loaded++; // We checked the forum
  if (loaded == 4) updateBanner(); // If the others were checked too, we can update the banner
}

// Same here
var handler_kickstarter = function handler_kickstarter(response) {
  if (!(response.readyState == 4 && response.status == 200)) return;

  var doc = new DOMParser().parseFromString(response.responseText, "text/html");

  var timeElement = getElementsByClass('post', doc, 'div')[0].getElementsByTagName('time')[0];
  if (Date.parse(timeElement.getAttribute('datetime')) > new Date() - 14*24*60*60*1000) {
    kickstarter_post = true;
    post_refs[posts] = kickstarter_ref;
    posts++;
  }
  loaded++;
  if (loaded == 4) updateBanner();
}

var handler_twitter = function handler_twitter(response, josh) {
  if (!(response.readyState == 4 && response.status == 200)) return;

  var doc = new DOMParser().parseFromString(response.responseText, "text/html");

  var timeElement = getElementsByClass('js-short-timestamp ', getElementsByClass('ProfileTweet', doc, 'div')[0], 'span')[0];
  if (new Date(parseInt(timeElement.getAttribute('data-time'))*1000) > new Date() - 14*24*60*60*1000) { // Multiply the value of the timeElement date attribute by 1000 because its given in seconds
    if (josh) post_refs[posts] = twitter_josh_ref; else post_refs[posts] = twitter_lt_ref;
    posts++;
  }
  loaded++;
  if (loaded == 4) updateBanner();
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
  
  // Load Josh's Twitter page
  setTimeout(function() {
    GM_xmlhttpRequest({
      method: "GET",
      url: twitter_josh_link,
      onload: function(response) {
        handler_twitter(response, true);
      }
    });
  }, 0);
  
  // Load the LimitTheory Twitter page
  setTimeout(function() {
    GM_xmlhttpRequest({
      method: "GET",
      url: twitter_lt_link,
      onload: function(response) {
        handler_twitter(response, false);
      }
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

// Source: http://www.codeproject.com/Tips/201899/String-Format-in-JavaScript
function injectStringFormat() {
  String.prototype.format = function (args) {
    var str = this;
    return str.replace(String.prototype.format.regex, function(item) {
      var intVal = parseInt(item.substring(1, item.length - 1));
      var replace;
      if (intVal >= 0) {
        replace = args[intVal];
      } else if (intVal === -1) {
        replace = "{";
      } else if (intVal === -2) {
        replace = "}";
      } else {
        replace = "";
      }
      return replace;
    });
  };
  String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");
}
