/** 
    vancouverTrails.search - filter vancouver trails' trails list
    Copyright (C) 2017  Zachary Wiens

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

**/
// ==UserScript==
// @name         Vancouver Trails Search - Improved Filter
// @namespace    zwiens
// @version      0.1
// @description  Filter vancovuer trails search by "sort by" columns
// @include      https://www.vancouvertrails.com/trails/?*
// @match        https://www.vancouvertrails.com/trails/
// ==/UserScript==
var debug = false;//can do this to log why a trail is removed
function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script); // run the script
    document.body.removeChild(script); // clean up
}
function startRun() {
    var script = document.createElement("script");
    script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js");
    script.addEventListener('load', function() {
        exec("jQuery.noConflict()");
    }, false);
    document.body.appendChild(script);
}

function trail(name, rating, region, difficulty, time, distance, season) {
        this.name = name;
        this.rating = rating;
        this.region = region;
        this.difficulty = difficulty;
        this.time = time;
        this.distance =distance;
        this.season = season;
}

function getRating(r){
    r = r.replace("Rating: ", "").replace("Stars","");
    if(r.includes("One & Half"))return 1.5;
    if(r.includes("Two & Half"))return 2.5;
    if(r.includes("Three & Half"))return 3.5;
    if(r.includes("Four & Half"))return 4.5;
    if(r.includes("One"))return 1;
    if(r.includes("Two"))return 2;
    if(r.includes("Three"))return 3;
    if(r.includes("Four"))return 4;
    if(r.includes("Five"))return 5;
    return r;
}

function getTime(t){
    return t.replace(" hours", "");
}

function getDistance(d){
    return d.replace("km","");
}

function getDateNum(m){
    return new Date(m+'-1-01').getMonth();
}

function getSeason(s){
    if(s.includes("year-round"))return ["year-round"];
    var split = s.split(" - ");
    return [getDateNum(split[0]),getDateNum(split[1])];
}

function getDifficulty(d){
    if(d.includes("Easy"))return 1;
    if(d.includes("Intermediate"))return 2;
    if(d.includes("Difficult"))return 3;
}

function buildTrail(elem){
    var name = elem.children["0"].textContent;
    var rating = getRating(elem.children[1].children["0"].textContent);
    var region = elem.children[1].children[1].innerText;
    var difficulty = getDifficulty(elem.children[1].children[2].innerText);
    var time = getTime(elem.children[1].children[3].innerText);
    var distance = getDistance(elem.children[1].children[4].innerText);
    var season = getSeason(elem.children[1].children[5].innerText);
    return new trail(name, rating, region, difficulty, time, distance, season);
}

function options(minRating, difficulties, distance, time, seasonVariableBy1){
    this.minRating = minRating;
    this.difficulties = difficulties;
    this.minDistance = distance;
    this.minTime = time;
    this.seasonVariableBy1 = seasonVariableBy1;
}

function getOptions(){
    var minRating = prompt("Enter the minimum rating", "eg '3.5'");
    var difficultiesStr = prompt("Enter difficulties (1=Easy, 2=Intermediate, 3=Difficult. seperate with semicolon, no space)", "eg '2;3'");
    var difficulties = difficultiesStr.split(";");
    var distance = prompt("Enter minimum distance", "5");
    var time = prompt("Enter minimum time", "3");
    var seasonVariableBy1 = prompt("For season, add a month to range? ie yes gives hikes starting in june, when it's actually may.", "eg 'no'") == "yes" ? true : false;
    return new options(minRating, difficulties, distance, time, seasonVariableBy1);
}

function filterMin(min, curr){
    //< will let undefined ratings through, intentionally leaving it as is
    return Number(curr) < Number(min);
}

function filterRating(min, curr){
    return filterMin(min, curr);
}

function filterDifficulty(d, curr){
    var match = false;
    d.forEach(function(currentDiff, i, a){
        if(currentDiff == curr){//intentionally not using '==='
            match = true;
        }
    });
    return !match;
}

function filterTime(min, curr){
   return filterMin(min, curr);
}

function filterDistance(min, curr){
    return filterMin(min, curr);
}

function filterSeason(variable, actualMonth, curr){
    if(curr[0] === "year-round")return false;
    var m = variable ? actualMonth +1 : actualMonth;
    return !(m >= curr[0] && m <= curr[1]);
}

function hide(li){
    li.style.display = "none";
}
function log(trail, reason){
    if(debug){
        console.log("removed " + trail.name + " because of: " +reason);
    }
}
function filter(options) {
    var trails = jQuery("ul.row.traillist > li a").not("ul li ul a");//each hike element in the list has a ul for name/rating/difficulty etc. This avoid the nested ul
    var month = new Date().getMonth();

    //filter
    trails.each(function(i, li) {
        var trail = buildTrail(jQuery(li)[0]);
        if(filterRating(options.minRating, trail.rating)){
           log(trail, "rating");
           hide(li);
           return true;
        }
        if(filterDifficulty(options.difficulties, trail.difficulty)){
           log(trail, "diff");
           hide(li);
           return true;
        }
        if(filterTime(options.minTime, trail.time)){
           log(trail, "time");
           hide(li);
           return true;
        }
        if(filterDistance(options.minDistance, trail.distance)){
            log(trail, "distance");
            hide(li);
           return true;
        }
        if(filterSeason(options.seasonVariableBy1, month, trail.season)){
             log(trail, "season");
            hide(li);
            return true;
        }
    });
}


startRun();//loads dependencies
var opts = getOptions();
filter(opts);

